import nextEnv from "@next/env";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());

const hasArabic = (value: unknown) => /[\u0600-\u06FF]/.test(String(value ?? ""));

const visibleText = (value: unknown): string => {
  const chunks: string[] = [];

  const walk = (node: unknown) => {
    if (typeof node === "string") {
      chunks.push(node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (node && typeof node === "object") {
      Object.values(node as Record<string, unknown>).forEach(walk);
    }
  };

  walk(value);
  return chunks.join(" ");
};

const latinLeakCount = (value: unknown) =>
  (String(value ?? "").match(/[A-Za-z][A-Za-z'’&.-]{2,}/g) ?? []).length;

const placeholderNeedles = [
  "مسار قيد الترجمة",
  "محتوى هذا المسار غير مكتمل في نظام إدارة المحتوى",
  "تفاصيل اليوم قيد الترجمة",
];

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const db = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await db.connect();

  const city = (
    await db.query<{
      id: number;
      lede: string | null;
      name: string;
      translations: { ar?: Record<string, unknown> } | null;
    }>(`
      select id, name, lede, translations
      from payload.cities
      where slug = 'london'
      limit 1
    `)
  ).rows[0];
  if (!city) throw new Error("London city record was not found.");

  const cityAr = city.translations?.ar ?? {};
  const cityIssues: string[] = [];
  for (const field of [
    "bestTimeToVisit",
    "countryName",
    "currency",
    "description",
    "languages",
    "lede",
    "name",
  ]) {
    if (!hasArabic(cityAr[field])) cityIssues.push(`city_${field}_missing_arabic`);
  }
  const cityVisibleText = visibleText(cityAr);
  if (latinLeakCount(cityVisibleText) > 0) cityIssues.push("city_latin_text");

  const itineraryRows = (
    await db.query<{
      slug: string;
      title: string;
      summary: string | null;
      intro: string | null;
      translations: { ar?: Record<string, unknown> } | null;
    }>(
      `
        select slug, title, summary, intro, translations
        from payload.itineraries
        where city_id = $1
        order by id
      `,
      [city.id],
    )
  ).rows;

  const itineraryIssues = itineraryRows.flatMap((row) => {
    const ar = row.translations?.ar ?? {};
    const text = visibleText(ar);
    const issues: string[] = [];

    for (const field of ["audience", "intro", "summary", "title"]) {
      if (!hasArabic(ar[field])) issues.push(`${field}_missing_arabic`);
    }

    const planning = ar.planning as Record<string, unknown> | undefined;
    if (!hasArabic(planning?.stay)) issues.push("planning_stay_missing_arabic");
    if (!hasArabic(planning?.transport)) issues.push("planning_transport_missing_arabic");
    const meals = planning?.meals as Record<string, unknown> | undefined;
    for (const field of ["breakfast", "dinner", "lunch"]) {
      if (!hasArabic(meals?.[field])) issues.push(`planning_meals_${field}_missing_arabic`);
    }

    const days = Array.isArray(ar.days) ? ar.days as Record<string, unknown>[] : [];
    if (days.length === 0) issues.push("days_missing");
    for (const day of days) {
      for (const field of [
        "breakfast",
        "description",
        "dinner",
        "lunch",
        "pacing",
        "routeNotes",
        "start",
        "theme",
        "transport",
      ]) {
        if (!hasArabic(day[field])) issues.push(`day_${field}_missing_arabic`);
      }
    }

    if (placeholderNeedles.some((needle) => text.includes(needle))) {
      issues.push("placeholder_copy");
    }
    if (latinLeakCount(text) > 0) issues.push("latin_text");

    return issues.length > 0
      ? [{ issues: issues.join(","), slug: row.slug, title: row.title }]
      : [];
  });

  console.log("London Arabic shell and itinerary QA");
  console.log(
    JSON.stringify(
      {
        cityIssues,
        itineraryIssues: itineraryIssues.length,
        itineraries: itineraryRows.length,
      },
      null,
      2,
    ),
  );
  console.table(itineraryIssues);

  await db.end();

  if (cityIssues.length > 0 || itineraryIssues.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
