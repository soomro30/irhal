import karachiAr from "@/data/karachi-ar.json";
import nextEnv from "@next/env";
import { getPayload } from "payload";

type ArabicItemEntry = {
  address?: string;
  area?: string;
  category?: string;
  overview?: string[];
  summary?: string;
  title?: string;
};

type GuideItemDoc = {
  arabicAddress?: string | null;
  arabicArea?: string | null;
  arabicCategory?: string | null;
  arabicOverview?: string | null;
  arabicSummary?: string | null;
  arabicTitle?: string | null;
  id: number | string;
  kind?: string | null;
  slug?: string | null;
  title?: string | null;
};

const arabicItems =
  (karachiAr as { items?: Record<string, ArabicItemEntry> }).items ?? {};

const hasArabic = (value?: string | null) => Boolean(value && /[\u0600-\u06ff]/.test(value));

const clean = (value?: string) => value?.trim() || undefined;

const cleanParagraphs = (value?: string[]) =>
  (value ?? []).map((paragraph) => paragraph.trim()).filter(Boolean);

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  nextEnv.loadEnvConfig(process.cwd());
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const { default: config } = await import("@/payload.config");
const payload = await getPayload({ config });

let page = 1;
let scanned = 0;
let updated = 0;
let skippedNoArabicSource = 0;
let skippedAlreadyArabic = 0;

for (;;) {
  const result = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    page,
    where: {
      city: {
        exists: true,
      },
    },
  });

  for (const doc of result.docs as GuideItemDoc[]) {
    scanned += 1;
    const key = `${doc.kind ?? ""}:${doc.slug ?? ""}`;
    const entry = arabicItems[key];
    if (!entry) {
      skippedNoArabicSource += 1;
      continue;
    }

    const overview = cleanParagraphs(entry.overview);
    const data = {
      ...(hasArabic(doc.arabicTitle)
        ? {}
        : clean(entry.title)
          ? { arabicTitle: clean(entry.title) }
          : {}),
      ...(hasArabic(doc.arabicSummary)
        ? {}
        : clean(entry.summary)
          ? { arabicSummary: clean(entry.summary) }
          : {}),
      ...(hasArabic(doc.arabicOverview)
        ? {}
        : overview.length > 0
          ? { arabicOverview: overview.join("\n\n") }
          : {}),
      ...(hasArabic(doc.arabicArea)
        ? {}
        : clean(entry.area)
          ? { arabicArea: clean(entry.area) }
          : {}),
      ...(hasArabic(doc.arabicCategory)
        ? {}
        : clean(entry.category)
          ? { arabicCategory: clean(entry.category) }
          : {}),
      ...(hasArabic(doc.arabicAddress)
        ? {}
        : clean(entry.address)
          ? { arabicAddress: clean(entry.address) }
          : {}),
    };

    if (Object.keys(data).length === 0) {
      skippedAlreadyArabic += 1;
      continue;
    }

    await payload.update({
      collection: "guide-items" as never,
      context: { skipPublicRevalidate: true },
      id: doc.id,
      data: data as never,
      overrideAccess: true,
    });

    updated += 1;
    console.log(`updated ${key} (${doc.title ?? doc.id})`);
  }

  if (!result.hasNextPage) break;
  page += 1;
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

process.exit(0);
