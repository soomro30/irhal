import karachiAr from "@/data/karachi-ar.json";
import nextEnv from "@next/env";
import { Client } from "pg";

type ArabicItemEntry = {
  address?: string;
  area?: string;
  category?: string;
  overview?: string[];
  summary?: string;
  title?: string;
};

type GuideItemRow = {
  arabic_address?: string | null;
  arabic_area?: string | null;
  arabic_category?: string | null;
  arabic_overview?: string | null;
  arabic_summary?: string | null;
  arabic_title?: string | null;
  id: number;
  kind: string;
  slug: string;
  title: string;
};

const arabicItems =
  (karachiAr as { items?: Record<string, ArabicItemEntry> }).items ?? {};

const hasArabic = (value?: string | null) =>
  Boolean(value && /[\u0600-\u06ff]/.test(value));

const clean = (value?: string) => value?.trim() || undefined;

const cleanOverview = (value?: string[]) => {
  const paragraphs = (value ?? [])
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs.join("\n\n") : undefined;
};

const addField = (
  updates: string[],
  values: unknown[],
  column: string,
  value: string | undefined,
) => {
  if (!value) return;
  values.push(value);
  updates.push(`${column} = $${values.length}`);
};

if (!process.env.DATABASE_URL) {
  nextEnv.loadEnvConfig(process.cwd());
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await db.connect();

let scanned = 0;
let skippedAlreadyArabic = 0;
let skippedNoArabicSource = 0;
let updated = 0;

try {
  const cityResult = await db.query<{ id: number }>(
    "select id from payload.cities where slug = $1 limit 1",
    ["karachi"],
  );
  const cityId = cityResult.rows[0]?.id;
  if (!cityId) throw new Error("Karachi city row not found.");

  const result = await db.query<GuideItemRow>(
    `select id, kind::text, slug, title,
            arabic_title, arabic_summary, arabic_overview,
            arabic_area, arabic_category, arabic_address
       from payload.guide_items
      where city_id = $1
      order by id`,
    [cityId],
  );

  for (const row of result.rows) {
    scanned += 1;
    const key = `${row.kind}:${row.slug}`;
    const entry = arabicItems[key];
    if (!entry) {
      skippedNoArabicSource += 1;
      continue;
    }

    const updates: string[] = [];
    const values: unknown[] = [];

    if (!hasArabic(row.arabic_title)) {
      addField(updates, values, "arabic_title", clean(entry.title));
    }
    if (!hasArabic(row.arabic_summary)) {
      addField(updates, values, "arabic_summary", clean(entry.summary));
    }
    if (!hasArabic(row.arabic_overview)) {
      addField(updates, values, "arabic_overview", cleanOverview(entry.overview));
    }
    if (!hasArabic(row.arabic_area)) {
      addField(updates, values, "arabic_area", clean(entry.area));
    }
    if (!hasArabic(row.arabic_category)) {
      addField(updates, values, "arabic_category", clean(entry.category));
    }
    if (!hasArabic(row.arabic_address)) {
      addField(updates, values, "arabic_address", clean(entry.address));
    }

    if (updates.length === 0) {
      skippedAlreadyArabic += 1;
      continue;
    }

    values.push(row.id);
    await db.query(
      `update payload.guide_items
          set ${updates.join(", ")},
              updated_at = now()
        where id = $${values.length}`,
      values,
    );
    updated += 1;
    console.log(`updated ${key} (${row.title})`);
  }

  console.log(
    JSON.stringify(
      {
        scanned,
        skippedAlreadyArabic,
        skippedNoArabicSource,
        updated,
      },
      null,
      2,
    ),
  );
} finally {
  await db.end();
}
