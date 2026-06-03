import karachiAr from "@/data/karachi-ar.json";
import nextEnv from "@next/env";
import { Client } from "pg";

type GuideSectionRow = {
  id: number;
  section_slug: string;
  title: string;
  translations: Record<string, unknown> | null;
};

const arabicArticles =
  (
    karachiAr as {
      articles?: Record<string, Record<string, Record<string, unknown>>>;
    }
  ).articles ?? {};

const arabicSectionCopy: Record<string, { summary: string; title: string }> = {
  "city-in-a-day-and-longer-itineraries": {
    title: "مسارات يومية وبرامج أطول",
    summary: "خطط مقترحة ليوم واحد أو أكثر حسب الأحياء وإيقاع المدينة.",
  },
  "city-information": {
    title: "معلومات عن المدينة",
    summary: "خلفية عملية عن كراتشي اليوم وتاريخها وطابعها الحضري.",
  },
  "children-in-tow": {
    title: "السفر مع الأطفال",
    summary: "أنشطة عائلية ومناطق مناسبة لتخطيط رحلة مريحة مع الأطفال.",
  },
  "data-resources-and-update-workflow": {
    title: "مصادر البيانات وسير التحديث",
    summary: "مصادر تحريرية وقواعد تحقق تساعد فريق إرحل على تحديث الدليل.",
  },
  "festivals-and-annual-events": {
    title: "المهرجانات والفعاليات",
    summary: "مواسم وفعاليات تساعدك على اختيار توقيت الرحلة.",
  },
  "food-and-restaurants": {
    title: "الطعام والمطاعم",
    summary: "مطاعم ومناطق طعام منظمة في صفحات واضحة.",
  },
  "health-and-safety": {
    title: "الصحة والسلامة",
    summary: "نصائح عملية للماء والطعام والتنقل والطقس والطوارئ.",
  },
  hotels: {
    title: "الفنادق",
    summary: "خيارات إقامة عملية حسب المنطقة ونوع الرحلة.",
  },
  "muslim-visitor-information": {
    title: "معلومات للمسافر المسلم",
    summary: "مساجد ومطاعم حلال وملاحظات مفيدة للصلاة والعائلة.",
  },
  "neighborhood-operating-guide": {
    title: "دليل المناطق",
    summary: "كيف تختار المنطقة وتتحرك داخل المدينة.",
  },
  "organized-tours": {
    title: "الجولات والتجارب",
    summary: "أفكار جولات للتراث والطعام والساحل.",
  },
  "places-to-visit": {
    title: "أماكن تستحق الزيارة",
    summary: "معالم ومتاحف وشواطئ وحدائق تستحق الزيارة.",
  },
  shopping: {
    title: "التسوق",
    summary: "أسواق ومراكز تجارية وشوارع أزياء ومحلات هدايا.",
  },
  "transportation-and-getting-around": {
    title: "المواصلات والتنقل",
    summary: "تنقل عملي من المطار وبين مناطق المدينة المختلفة.",
  },
  "visitor-information": {
    title: "معلومات الزائر",
    summary: "التأشيرة، الحقائق السريعة، الطقس، العطلات، ومراجع الوصول الأولى.",
  },
};

const hasArabicArticlePayload = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  return /[\u0600-\u06ff]/.test(JSON.stringify(value));
};

const hasArabicText = (value: unknown) =>
  typeof value === "string" && /[\u0600-\u06ff]/.test(value);

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

  const result = await db.query<GuideSectionRow>(
    `select id, section_slug, title, translations
       from payload.guide_sections
      where city_id = $1
      order by id`,
    [cityId],
  );

  for (const row of result.rows) {
    scanned += 1;
    const articles = arabicArticles[row.section_slug];
    if (!articles || Object.keys(articles).length === 0) {
      skippedNoArabicSource += 1;
      continue;
    }

    const translations = row.translations ?? {};
    const ar = {
      ...((translations.ar && typeof translations.ar === "object"
        ? translations.ar
        : {}) as Record<string, unknown>),
    };
    const sectionCopy = arabicSectionCopy[row.section_slug];
    let changed = false;
    if (sectionCopy && !hasArabicText(ar.title)) {
      ar.title = sectionCopy.title;
      changed = true;
    }
    if (sectionCopy && !hasArabicText(ar.summary)) {
      ar.summary = sectionCopy.summary;
      changed = true;
    }
    const existingArticles =
      ar.articles && typeof ar.articles === "object"
        ? (ar.articles as Record<string, unknown>)
        : {};
    const nextArticles = { ...existingArticles };

    for (const [articleSlug, articleTranslation] of Object.entries(articles)) {
      if (hasArabicArticlePayload(nextArticles[articleSlug])) continue;
      nextArticles[articleSlug] = articleTranslation;
      changed = true;
    }

    if (!changed) {
      skippedAlreadyArabic += 1;
      continue;
    }

    await db.query(
      `update payload.guide_sections
          set translations = $1::jsonb,
              updated_at = now()
        where id = $2`,
      [{ ...translations, ar: { ...ar, articles: nextArticles } }, row.id],
    );
    updated += 1;
    console.log(`updated ${row.section_slug} (${row.title})`);
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
