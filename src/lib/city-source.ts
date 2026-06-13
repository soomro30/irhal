import config from "@/payload.config";
import { unstable_cache } from "next/cache";
import { after } from "next/server";
import { getPayload } from "payload";
import { cache } from "react";

import type {
  CityGuide,
  GuideBlock,
  CityGuideImport,
  CityGuideItem,
  GuideSection,
  GuideTableBlock,
  Itinerary,
  LocaleTranslations,
  Listing,
  ListingType,
  Neighborhood,
} from "./city-data";
import {
  cities as localCities,
  getCityBySlug as getLocalCityBySlug,
} from "./city-data";
import { guidePlaceholderImageByKind } from "./image-placeholders";

type CMSDoc = Record<string, unknown> & {
  id: number | string;
};

export type CityNavItem = {
  cardImageUrl?: string;
  country: string;
  heroImageUrl?: string;
  name: string;
  slug: string;
  translations?: LocaleTranslations;
};

const isProduction = process.env.NODE_ENV === "production";
const secondsFromEnv = (value: string | undefined, fallback: number) => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const defaultCityCacheTtlSeconds =
  process.env.NODE_ENV === "development" ? 5 : 60 * 60 * 24;
const configuredCityCacheTtlSeconds = secondsFromEnv(
  process.env.IRHAL_CITY_CACHE_SECONDS,
  defaultCityCacheTtlSeconds,
);
const minimumProductionCityCacheTtlSeconds = secondsFromEnv(
  process.env.IRHAL_MIN_CITY_CACHE_SECONDS,
  60 * 60 * 6,
);
const cityCacheTtlSeconds =
  isProduction
    ? Math.max(configuredCityCacheTtlSeconds, minimumProductionCityCacheTtlSeconds)
    : configuredCityCacheTtlSeconds;
const cachePayloadWarningBytes = Number(
  process.env.IRHAL_CACHE_ITEM_WARNING_BYTES ?? 1_500_000,
);
const maxCityCacheCollectionLimit = Number(
  process.env.IRHAL_CITY_CACHE_COLLECTION_LIMIT ?? 1000,
);

type CityCacheScope =
  | "guide-items"
  | "guide-sections"
  | "itineraries"
  | "listings"
  | "neighborhoods"
  | "shell";

type CityShell = Omit<
  CityGuide,
  | "fullGuide"
  | "guideArticleTranslations"
  | "guideItemGalleries"
  | "guideItemImages"
  | "guideItemNeighborhoods"
  | "guideItemOverrides"
  | "guideItemTranslations"
  | "guideItems"
  | "itineraries"
  | "listings"
  | "neighborhoods"
> & {
  cityId?: number | string;
  extractedAt: string;
  structuredGuide?: CityGuideImport;
};

type GuideItemsCacheData = {
  guideItemGalleries: Record<string, string[]>;
  guideItemImages: Record<string, string>;
  guideItemNeighborhoods: Record<string, string>;
  guideItems: CityGuideItem[];
  translations: Record<string, LocaleTranslations>;
  overrides: NonNullable<CityGuide["guideItemOverrides"]>;
};

type GuideSectionsCacheData = {
  fullGuide?: CityGuideImport;
  translations: Record<string, LocaleTranslations>;
};

const cityCacheTags = (slug: string, scope?: CityCacheScope) => [
  "irhal-city",
  `irhal-city:${slug}`,
  ...(scope ? [`irhal-city-${scope}:${slug}`] : []),
];

const cacheWithCityTags = <T>(
  scope: CityCacheScope,
  slug: string,
  loader: () => Promise<T>,
) =>
  unstable_cache(loader, [`irhal-city-${scope}-v2`, slug], {
    revalidate: cityCacheTtlSeconds,
    tags: cityCacheTags(slug, scope),
  })();

const cachePayloadSize = (label: string, value: unknown) => {
  if (cachePayloadWarningBytes <= 0) return;

  try {
    const bytes = Buffer.byteLength(JSON.stringify(value));
    if (bytes > cachePayloadWarningBytes) {
      console.warn(
        `${label} cache payload is ${(bytes / 1_000_000).toFixed(2)} MB; split this cache entry before it reaches Vercel's 2 MB item limit.`,
      );
    }
  } catch (error) {
    console.warn(`${label} cache payload size check failed.`, error);
  }
};

const withCachePayloadTelemetry = <T>(label: string, value: T): T => {
  cachePayloadSize(label, value);
  return value;
};

const isCMSConfigured = () =>
  Boolean(
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("<") &&
    process.env.PAYLOAD_SECRET,
  );

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const asNumber = (value: unknown, fallback = 0) => {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : fallback;

  return Number.isFinite(parsed) ? parsed : fallback;
};
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const normalizeTranslations = (value: unknown) =>
  asRecord(value) as LocaleTranslations;
const splitParagraphs = (value: unknown): string[] =>
  asString(value)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

const mergeGuideItemArabicFields = (
  doc: CMSDoc,
  translations: LocaleTranslations,
): LocaleTranslations => {
  const arabic = {
    ...asRecord(translations.ar),
    ...(asString(doc.arabicTitle) ? { title: asString(doc.arabicTitle) } : {}),
    ...(asString(doc.arabicSummary)
      ? { summary: asString(doc.arabicSummary) }
      : {}),
    ...(splitParagraphs(doc.arabicOverview).length > 0
      ? { overview: splitParagraphs(doc.arabicOverview) }
      : {}),
    ...(asString(doc.arabicArea) ? { area: asString(doc.arabicArea) } : {}),
    ...(asString(doc.arabicCategory)
      ? { category: asString(doc.arabicCategory) }
      : {}),
    ...(asString(doc.arabicAddress)
      ? { address: asString(doc.arabicAddress) }
      : {}),
  };

  return Object.keys(arabic).length > 0
    ? { ...translations, ar: arabic }
    : translations;
};

const guideItemFallbackImageByKind = guidePlaceholderImageByKind;

const isGuideItemKind = (value: string): value is CityGuideItem["kind"] =>
  value in guideItemFallbackImageByKind;

const plainTextFromLexicalNode = (value: unknown): string => {
  const node = asRecord(value);
  const text = asString(node.text);
  const childText = asArray(node.children)
    .map(plainTextFromLexicalNode)
    .filter(Boolean)
    .join("");

  return text || childText;
};

const normalizeRichTextParagraphs = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
  }

  const root = asRecord(asRecord(value).root);
  const rootChildren = asArray(root.children);

  return rootChildren
    .map((node) => plainTextFromLexicalNode(node).replace(/\s+/g, " ").trim())
    .filter(Boolean);
};

const relationshipId = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") return value;
  const record = asRecord(value);
  return record.id as number | string | undefined;
};

const relationshipName = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  return asString(record.name, fallback);
};

const mediaUrl = (value: unknown, preferredSizes: string[] = ["hero", "card"]) => {
  const media = asRecord(value);
  const sizes = asRecord(media.sizes);
  const originalUrl = asString(media.url);

  for (const sizeName of preferredSizes) {
    if (sizeName === "original" && originalUrl) return originalUrl;
    const size = asRecord(sizes[sizeName]);
    const url = asString(size.url);
    if (url) return url;
  }

  return originalUrl;
};

const mediaCandidateUrl = (value: unknown) => {
  const candidate = asRecord(value);
  const url = asString(candidate.url);
  const width = asNumber(candidate.width);
  const height = asNumber(candidate.height);

  if (!url || width < 640 || height < 360) return undefined;
  return url;
};

const guideItemMediaUrl = (value: unknown) => {
  const media = asRecord(value);
  const usageStatus = asString(media.usageStatus);
  if (usageStatus !== "approved") {
    return undefined;
  }

  const sizes = asRecord(media.sizes);
  const hero = asRecord(sizes.hero);
  const card = asRecord(sizes.card);

  return (
    mediaCandidateUrl(hero) ||
    mediaCandidateUrl(card) ||
    mediaCandidateUrl(media)
  );
};

const normalizeSeo = (
  value: unknown,
  fallbackTitle: string,
  fallbackDescription: string,
) => {
  const seo = asRecord(value);
  return {
    title: asString(seo.title, fallbackTitle),
    description: asString(seo.description, fallbackDescription),
    canonicalPath: asString(seo.canonicalPath),
    schemaType: asString(seo.schemaType, "TravelGuide"),
  };
};

const emptySections = {
  visitorInformation: "",
  climateWhenToGo: "",
  transportSystem: "",
  festivalsEvents: "",
  healthSafety: "",
  muslimTravel: "",
};

const isGuideParagraphBlock = (
  value: unknown,
): value is Extract<GuideBlock, { type: "paragraph" }> => {
  const block = asRecord(value);
  return block.type === "paragraph" && typeof block.text === "string";
};

const isGuideTableBlock = (value: unknown): value is GuideTableBlock => {
  const block = asRecord(value);
  return block.type === "table" && Array.isArray(block.rows);
};

const normalizeGuideBlocks = (value: unknown): GuideBlock[] =>
  asArray(value).flatMap((block): GuideBlock[] => {
    if (isGuideParagraphBlock(block)) {
      return [
        {
          type: "paragraph",
          style: asString(block.style, "Normal"),
          text: block.text,
          links: asArray(block.links).filter(
            (link): link is { text: string; url: string } =>
              typeof asRecord(link).text === "string" &&
              typeof asRecord(link).url === "string",
          ),
        },
      ];
    }

    if (isGuideTableBlock(block)) {
      return [block];
    }

    return [];
  });

const normalizeRichTextBlocks = (value: unknown): GuideBlock[] =>
  normalizeRichTextParagraphs(value).map((text) => ({
    type: "paragraph",
    style: "Normal",
    text,
    links: [],
  }));

const normalizeGuideSectionBlocks = (doc: CMSDoc): GuideBlock[] => {
  const sourceImport = asRecord(doc.sourceImport);
  const articles = asArray(sourceImport.articles);
  const articleBlocks = articles.flatMap((articleValue) => {
    const article = asRecord(articleValue);
    const title = asString(article.title);
    const blocks = normalizeGuideBlocks(article.blocks);
    const summary = asString(article.summary);

    return [
      ...(title
        ? [
            {
              articleSlug: asString(article.slug),
              imageAlt: asString(article.imageAlt),
              imageUrl: asString(article.imageUrl),
              type: "paragraph" as const,
              style: "Heading 2",
              text: title,
              links: [],
            },
          ]
        : []),
      ...(blocks.length > 0
        ? blocks
        : summary
          ? [
              {
                type: "paragraph" as const,
                style: "Normal",
                text: summary,
                links: [],
              },
            ]
          : []),
    ];
  });

  if (articleBlocks.length > 0) return articleBlocks;

  const bodyBlocks = normalizeRichTextBlocks(doc.body);
  if (bodyBlocks.length > 0) return bodyBlocks;

  const summary = asString(doc.summary);
  return summary
    ? [{ type: "paragraph", style: "Normal", text: summary, links: [] }]
    : [];
};

const normalizeCmsGuideSections = ({
  cityDoc,
  docs,
  fallbackGuide,
}: {
  cityDoc: CMSDoc;
  docs: CMSDoc[];
  fallbackGuide?: CityGuideImport;
}): CityGuideImport | undefined => {
  if (docs.length === 0) return undefined;

  const fallbackOrder = new Map(
    (fallbackGuide?.sections ?? []).map((section, index) => [
      section.slug,
      index,
    ]),
  );
  const sections: GuideSection[] = docs
    .map((doc) => ({
      title: asString(doc.title),
      slug: asString(doc.sectionSlug),
      summary: asString(doc.summary) || undefined,
      blocks: normalizeGuideSectionBlocks(doc),
      translations: normalizeTranslations(doc.translations),
    }))
    .filter((section) => section.title && section.slug)
    .sort((a, b) => {
      const aOrder = fallbackOrder.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
      const bOrder = fallbackOrder.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.title.localeCompare(b.title);
    });

  if (sections.length === 0) return undefined;

  const tables = sections.flatMap((section) =>
    section.blocks.filter(
      (block): block is GuideTableBlock => block.type === "table",
    ),
  );

  return {
    source: {
      fileName: "payload:guide-sections",
      extractedAt: asString(cityDoc.updatedAt) || new Date(0).toISOString(),
      formatVersion: "payload",
    },
    city: {
      name: asString(cityDoc.name),
      slug: asString(cityDoc.slug),
      country: relationshipName(cityDoc.country),
      region: asString(cityDoc.region),
      updatedLabel: asString(cityDoc.lastVerifiedAt),
    },
    introBlocks: [],
    sections,
    tables,
    coverage: {
      sectionCount: sections.length,
      tableCount: tables.length,
      requiredSectionSlugs: sections.map((section) => section.slug),
      missingRequiredSectionSlugs: [],
      tableRowCounts: Object.fromEntries(
        tables.map((table) => [table.purpose, table.rows.length]),
      ),
    },
  };
};

const normalizeStructuredGuideImport = (
  value: unknown,
): CityGuideImport | undefined => {
  const guide = asRecord(value);
  return Array.isArray(guide.sections) ? (value as CityGuideImport) : undefined;
};

const normalizeLanguages = (value: unknown) =>
  asArray(value)
    .map((item) => {
      if (typeof item === "string") return item;
      return asString(asRecord(item).language);
    })
    .filter(Boolean);

const normalizeNeighborhood = (doc: CMSDoc): Neighborhood => {
  const district = asRecord(doc.district);

  return {
    slug: asString(doc.slug),
    name: asString(doc.name),
    district: relationshipName(doc.district, "District"),
    zone: asString(district.zone),
    clusterType: asString(doc.clusterType, "mixed"),
    latitude: asNumber(doc.latitude),
    longitude: asNumber(doc.longitude),
    mapUrl: asString(doc.mapUrl),
    operatingGuide: asString(doc.operatingGuide),
    translations: normalizeTranslations(doc.translations),
    bestFor: asArray(doc.bestFor)
      .map((item) => asString(asRecord(item).value))
      .filter(Boolean),
    liveMapQueries: asArray(doc.liveMapQueries).map((item) => {
      const query = asRecord(item);
      return {
        label: asString(query.label),
        query: asString(query.query),
        providerUrl: asString(query.providerUrl),
      };
    }),
  };
};

const normalizeListing = (doc: CMSDoc): Listing => {
  const neighborhoodSlug = asString(asRecord(doc.neighborhood).slug);
  const seo = normalizeSeo(
    doc.seo,
    asString(doc.name),
    asString(doc.shortDescription),
  );
  const muslimTravel = asRecord(doc.muslimTravel);

  return {
    slug: asString(doc.slug),
    name: asString(doc.name),
    listingType: asString(doc.listingType, "place") as ListingType,
    neighborhoodSlug,
    address: asString(doc.address),
    latitude: asNumber(doc.latitude),
    longitude: asNumber(doc.longitude),
    mapUrl: asString(doc.mapUrl),
    shortDescription: asString(doc.shortDescription),
    priceRange: asString(doc.priceRange) || undefined,
    website: asString(doc.website) || undefined,
    phone: asString(doc.phone) || undefined,
    affiliateUrl: asString(doc.affiliateUrl) || undefined,
    muslimTravel: {
      isHalal: Boolean(muslimTravel.isHalal),
      halalCertification:
        asString(muslimTravel.halalCertification) || undefined,
      womenPrayerArea: Boolean(muslimTravel.womenPrayerArea),
      familyFriendly: Boolean(muslimTravel.familyFriendly),
      notes: asString(muslimTravel.notes) || undefined,
    },
    seo,
    lastVerifiedAt: asString(doc.lastVerifiedAt),
  };
};

const normalizeItinerary = (doc: CMSDoc): Itinerary => ({
  slug: asString(doc.slug),
  title: asString(doc.title),
  durationDays: asNumber(doc.durationDays, 1),
  audience: asString(doc.audience, "first-time"),
  summary: asString(doc.summary),
  intro: asString(doc.intro) || undefined,
  planning: (() => {
    const planning = asRecord(doc.planning);
    const meals = asRecord(planning.meals);
    const value = {
      meals: {
        breakfast: asString(meals.breakfast) || undefined,
        dinner: asString(meals.dinner) || undefined,
        lunch: asString(meals.lunch) || undefined,
      },
      stay: asString(planning.stay) || undefined,
      transport: asString(planning.transport) || undefined,
    };
    const hasMeals = Object.values(value.meals).some(Boolean);
    const hasPlanning = Boolean(value.stay || value.transport || hasMeals);

    return hasPlanning
      ? {
          ...(hasMeals ? { meals: value.meals } : {}),
          ...(value.stay ? { stay: value.stay } : {}),
          ...(value.transport ? { transport: value.transport } : {}),
        }
      : undefined;
  })(),
  translations: normalizeTranslations(doc.translations),
  days: asArray(doc.days).map((item) => {
    const day = asRecord(item);
    const relationshipStops = asArray(day.stops)
      .map((stop) => {
        if (typeof stop === "string") return stop;
        return asString(asRecord(stop).slug);
      })
      .filter(Boolean);
    const slugStops = asString(day.stopSlugs)
      .split(/[\n,]+/)
      .map((stop) => stop.trim())
      .filter(Boolean);

    return {
      breakfast: asString(day.breakfast) || undefined,
      dayNumber: asNumber(day.dayNumber, 1),
      description: asString(day.description) || undefined,
      dinner: asString(day.dinner) || undefined,
      lunch: asString(day.lunch) || undefined,
      pacing: asString(day.pacing) || undefined,
      theme: asString(day.theme),
      start: asString(day.start) || undefined,
      stops: relationshipStops.length > 0 ? relationshipStops : slugStops,
      transport: asString(day.transport) || undefined,
      routeNotes: asString(day.routeNotes),
    };
  }),
});

const mergeCmsItinerariesWithFallback = (
  cmsItineraries: Itinerary[],
  fallbackItineraries: Itinerary[] = [],
) => {
  if (cmsItineraries.length === 0) return fallbackItineraries;

  const fallbackBySlug = new Map(
    fallbackItineraries.map((itinerary) => [itinerary.slug, itinerary]),
  );
  const cmsSlugs = new Set(cmsItineraries.map((itinerary) => itinerary.slug));
  const mergedCmsItineraries = cmsItineraries.map((itinerary) => {
    const fallback = fallbackBySlug.get(itinerary.slug);
    if (!fallback) return itinerary;

    const fallbackDaysByNumber = new Map(
      fallback.days.map((day) => [day.dayNumber, day]),
    );
    const cmsDayNumbers = new Set(itinerary.days.map((day) => day.dayNumber));

    return {
      ...fallback,
      ...itinerary,
      intro: itinerary.intro || fallback.intro,
      planning: itinerary.planning || fallback.planning,
      days: [
        ...itinerary.days.map((day) => {
          const fallbackDay = fallbackDaysByNumber.get(day.dayNumber);

          return {
            ...fallbackDay,
            ...day,
            breakfast: day.breakfast || fallbackDay?.breakfast,
            description: day.description || fallbackDay?.description,
            dinner: day.dinner || fallbackDay?.dinner,
            lunch: day.lunch || fallbackDay?.lunch,
            pacing: day.pacing || fallbackDay?.pacing,
            start: day.start || fallbackDay?.start,
            stops: day.stops.length > 0 ? day.stops : (fallbackDay?.stops ?? []),
            transport: day.transport || fallbackDay?.transport,
            routeNotes: day.routeNotes || fallbackDay?.routeNotes || "",
          };
        }),
        ...fallback.days.filter((day) => !cmsDayNumbers.has(day.dayNumber)),
      ],
    };
  });

  return [
    ...mergedCmsItineraries,
    ...fallbackItineraries.filter((itinerary) => !cmsSlugs.has(itinerary.slug)),
  ];
};

const normalizeGuideItemTranslations = (docs: CMSDoc[]) =>
  docs.reduce<Record<string, LocaleTranslations>>((translations, doc) => {
    const slug = asString(doc.slug);
    const kind = asString(doc.kind);
    const value = normalizeTranslations(doc.translations);

    if (slug && Object.keys(value).length > 0) {
      translations[slug] = value;
      if (kind) translations[`${kind}:${slug}`] = value;
    }

    return translations;
  }, {});

const normalizeGuideArticleTranslations = (docs: CMSDoc[]) =>
  docs.reduce<Record<string, LocaleTranslations>>((translations, doc) => {
    const sectionSlug = asString(doc.sectionSlug);
    const ar = asRecord(normalizeTranslations(doc.translations).ar);
    const articles = asRecord(ar.articles);
    if (!sectionSlug || Object.keys(articles).length === 0) return translations;

    for (const [articleSlug, articleTranslation] of Object.entries(articles)) {
      if (articleSlug && articleTranslation) {
        translations[`${sectionSlug}:${articleSlug}`] = {
          ar: asRecord(articleTranslation),
        };
      }
    }

    return translations;
  }, {});

const normalizeGuideItemOverrides = (docs: CMSDoc[]) =>
  docs.reduce<NonNullable<CityGuide["guideItemOverrides"]>>((overrides, doc) => {
    const slug = asString(doc.slug);
    const kind = asString(doc.kind);
    if (!slug) return overrides;

    const body = normalizeRichTextParagraphs(doc.body);
    const override = {
      area: asString(doc.area) || undefined,
      budget: asString(doc.budget) || undefined,
      category: asString(doc.category) || undefined,
      description: asString(doc.summary) || undefined,
      geoStatus:
        asString(doc.geoStatus) === "verified" ? ("verified" as const) : undefined,
      imageAlt: asString(doc.imageAlt) || undefined,
      mapUrl: asString(doc.mapUrl) || undefined,
      originalContent: body.length > 0 ? body : undefined,
      title: asString(doc.title) || undefined,
    };

    overrides[slug] = override;
    if (kind) overrides[`${kind}:${slug}`] = override;

    return overrides;
  }, {});

const normalizeImportedDetails = (value: unknown): Record<string, string> => {
  return Object.entries(asRecord(value)).reduce<Record<string, string>>(
    (details, [key, detail]) => {
      if (detail == null) return details;
      details[key] =
        typeof detail === "string" ? detail : JSON.stringify(detail);
      return details;
    },
    {},
  );
};

const normalizeGuideItems = ({
  citySlug,
  docs,
  guideItemGalleries,
  guideItemImages,
  guideItemNeighborhoods,
}: {
  citySlug: string;
  docs: CMSDoc[];
  guideItemGalleries: Record<string, string[]>;
  guideItemImages: Record<string, string>;
  guideItemNeighborhoods: Record<string, string>;
}): CityGuideItem[] => {
  return docs.flatMap((doc) => {
      const kindValue = asString(doc.kind);
      if (!isGuideItemKind(kindValue)) return [];

      const slug = asString(doc.slug);
      const title = asString(doc.title);
      if (!slug || !title) return [];

      const key = `${kindValue}:${slug}`;
      const details = normalizeImportedDetails(doc.importedDetails);
      const body = normalizeRichTextParagraphs(doc.body);
      const area = asString(doc.area);
      const category = asString(doc.category, kindValue);
      const neighborhoodSlug =
        guideItemNeighborhoods[key] ?? guideItemNeighborhoods[slug];
      const primaryImage = guideItemImages[key] ?? guideItemImages[slug];
      const gallery = guideItemGalleries[key] ?? guideItemGalleries[slug];
      const sourceTable = asString(doc.sourceTable, "payload");
      const translations = mergeGuideItemArabicFields(
        doc,
        normalizeTranslations(doc.translations),
      );
      const address =
        asString(doc.address) ||
        details.legacy_irhal_source_address ||
        details.legacy_irhal_source_location;
      const latitude = asNumber(doc.latitude, Number.NaN);
      const longitude = asNumber(doc.longitude, Number.NaN);
      const providerPlaceId = asString(doc.providerPlaceId);

      const item: CityGuideItem = {
        id: String(doc.id),
        citySlug,
        kind: kindValue,
        sectionSlug: asString(doc.sectionSlug),
        sourceTable,
        title,
        slug,
        eyebrow: `${kindValue.replace("-", " ")} in ${area || citySlug}`,
        area,
        ...(neighborhoodSlug ? { neighborhoodSlug } : {}),
        category,
        description: asString(doc.summary, `${title} in ${area || citySlug}.`),
        ...(asString(doc.budget) ? { budget: asString(doc.budget) } : {}),
        ...(asString(doc.mapUrl) ? { mapUrl: asString(doc.mapUrl) } : {}),
        ...(Number.isFinite(latitude) ? { latitude } : {}),
        ...(Number.isFinite(longitude) ? { longitude } : {}),
        ...(providerPlaceId ? { providerPlaceId } : {}),
        imageUrl: primaryImage ?? guideItemFallbackImageByKind[kindValue],
        imageAlt: asString(doc.imageAlt, `${title} ${kindValue} in ${citySlug}`),
        ...(Object.keys(translations).length > 0 ? { translations } : {}),
        details,
        ...(body.length > 0 ? { originalContent: body } : {}),
        ...(address ? { originalLocation: address } : {}),
        ...(primaryImage ? { cmsImageUrl: primaryImage } : {}),
        ...(gallery && gallery.length > 0 ? { galleryUrls: gallery } : {}),
        ...(asString(doc.updatedAt)
          ? { updatedAt: asString(doc.updatedAt) }
          : {}),
        ...(asString(doc.createdAt)
          ? { createdAt: asString(doc.createdAt) }
          : {}),
        geoStatus:
          asString(doc.geoStatus) === "verified"
            ? "verified"
            : "provider-enrichment-required",
      };

      return [item];
    });
};

const localCityNavItems = (): CityNavItem[] =>
  localCities.map((city) => ({
    cardImageUrl: city.heroImageUrl,
    country: city.country,
    heroImageUrl: city.heroImageUrl,
    name: city.name,
    slug: city.slug,
    translations: city.translations,
  }));

const loadCityNavItems = async (): Promise<CityNavItem[]> => {
  if (!isCMSConfigured()) {
    if (isProduction) {
      throw new Error(
        "Payload CMS is not configured in production. DATABASE_URL and PAYLOAD_SECRET are required.",
      );
    }

    return localCityNavItems();
  }

  try {
    const payload = await getPayload({ config });
    const cityResult = await payload.find({
      collection: "cities" as never,
      depth: 1,
      limit: 100,
      overrideAccess: true,
      sort: "name",
    });

    const items = (cityResult.docs as CMSDoc[])
      .map((doc) => {
        const slug = asString(doc.slug);

        return {
          cardImageUrl: mediaUrl(doc.heroImage, ["card", "hero"]) || undefined,
          country: relationshipName(doc.country),
          heroImageUrl:
            mediaUrl(doc.heroImage, ["original", "hero", "card"]) || undefined,
          name: asString(doc.name),
          slug,
          translations: normalizeTranslations(doc.translations),
        };
      })
      .filter((item) => item.name && item.slug);

    return items;
  } catch (error) {
    console.error("Payload city nav source failed.", error);
    throw error;
  }
};

const cachedLoadCityNavItems = unstable_cache(
  loadCityNavItems,
  ["irhal-city-nav-v5"],
  {
    revalidate: cityCacheTtlSeconds,
    tags: ["irhal-city-nav", "irhal-city"],
  },
);

const requestCachedLoadCityNavItems = cache(cachedLoadCityNavItems);

export const getCityNavItems = async (): Promise<CityNavItem[]> =>
  requestCachedLoadCityNavItems();

const assertCmsConfigured = () => {
  if (!isCMSConfigured()) {
    if (isProduction) {
      throw new Error(
        "Payload CMS is not configured in production. DATABASE_URL and PAYLOAD_SECRET are required.",
      );
    }

    return false;
  }

  return true;
};

const emptyGuideImportFromShell = (shell: CityShell): CityGuideImport => ({
  source: {
    fileName: "payload",
    extractedAt: shell.extractedAt || new Date(0).toISOString(),
    formatVersion: "payload",
  },
  city: {
    name: shell.name,
    slug: shell.slug,
    country: shell.country,
    region: shell.region,
    updatedLabel: shell.lastVerifiedAt,
  },
  introBlocks: [],
  sections: [],
  tables: [],
  coverage: {
    sectionCount: 0,
    tableCount: 0,
    requiredSectionSlugs: [],
    missingRequiredSectionSlugs: [],
    tableRowCounts: {},
  },
});

const loadCityShellBySlug = async (slug: string): Promise<CityShell | undefined> => {
  if (!assertCmsConfigured()) {
    const fallbackCity = getLocalCityBySlug(slug);
    if (!fallbackCity) return undefined;

    return {
      contentSource: "local",
      slug: fallbackCity.slug,
      name: fallbackCity.name,
      country: fallbackCity.country,
      region: fallbackCity.region,
      locale: fallbackCity.locale,
      lede: fallbackCity.lede,
      heroImageUrl: fallbackCity.heroImageUrl,
      heroImageUrls: fallbackCity.heroImageUrls,
      timezone: fallbackCity.timezone,
      currency: fallbackCity.currency,
      languages: fallbackCity.languages,
      latitude: fallbackCity.latitude,
      longitude: fallbackCity.longitude,
      mapUrl: fallbackCity.mapUrl,
      lastVerifiedAt: fallbackCity.lastVerifiedAt,
      translations: fallbackCity.translations,
      fastFacts: fallbackCity.fastFacts,
      sections: fallbackCity.sections,
      seo: fallbackCity.seo,
      extractedAt: fallbackCity.lastVerifiedAt,
      structuredGuide: fallbackCity.fullGuide,
    };
  }

  try {
    const payload = await getPayload({ config });
    const cityResult = await payload.find({
      collection: "cities" as never,
      depth: 2,
      limit: 1,
      overrideAccess: true,
      where: {
        slug: {
          equals: slug,
        },
      },
    });
    const cityDoc = cityResult.docs[0] as CMSDoc | undefined;
    if (!cityDoc) return undefined;

    const cityId = relationshipId(cityDoc);
    const cityHeroGalleryIds = () =>
      asArray(cityDoc.heroGallery)
        .map((entry) => relationshipId(asRecord(entry).image))
        .filter((id): id is number | string => id != null);
    const cityHeroImageUrl = mediaUrl(cityDoc.heroImage, [
      "original",
      "hero",
      "card",
    ]);
    const cityHeroGalleryImageIds = cityHeroGalleryIds();
    const cityHeroGalleryUrls = asArray(cityDoc.heroGallery)
      .map((entry) =>
        mediaUrl(asRecord(entry).image, ["original", "hero", "card"]),
      )
      .filter((url): url is string => Boolean(url));
    if (cityHeroGalleryImageIds.length > cityHeroGalleryUrls.length) {
      const mediaResult = await payload.find({
        collection: "media" as never,
        depth: 0,
        limit: cityHeroGalleryImageIds.length,
        overrideAccess: true,
        where: { id: { in: cityHeroGalleryImageIds } },
      });
      const mediaUrlById = new Map<number | string, string>();
      for (const mediaDoc of mediaResult.docs as CMSDoc[]) {
        const url = mediaUrl(mediaDoc, ["original", "hero", "card"]);
        if (url) mediaUrlById.set(mediaDoc.id, url);
      }
      for (const imageId of cityHeroGalleryImageIds) {
        const url = mediaUrlById.get(imageId);
        if (url) cityHeroGalleryUrls.push(url);
      }
    }
    const cmsHeroImageUrls = [cityHeroImageUrl, ...cityHeroGalleryUrls].filter(
      (url): url is string => Boolean(url),
    );
    const heroImageUrls = Array.from(
      new Set(cmsHeroImageUrls),
    );

    const structuredSections = normalizeStructuredGuideImport(
      cityDoc.structuredSections,
    );

    return withCachePayloadTelemetry(`city shell:${slug}`, {
      contentSource: "payload",
      cityId,
      slug: asString(cityDoc.slug),
      name: asString(cityDoc.name),
      country: relationshipName(cityDoc.country),
      region: asString(cityDoc.region),
      locale: asString(cityDoc.locale, "en"),
      lede: asString(cityDoc.lede),
      heroImageUrl: cityHeroImageUrl || undefined,
      heroImageUrls: heroImageUrls.length > 0 ? heroImageUrls : undefined,
      timezone: asString(cityDoc.timezone),
      currency: asString(cityDoc.currency),
      languages: normalizeLanguages(cityDoc.languages),
      latitude: asNumber(cityDoc.latitude),
      longitude: asNumber(cityDoc.longitude),
      mapUrl: asString(cityDoc.mapUrl),
      lastVerifiedAt: asString(cityDoc.lastVerifiedAt),
      translations: normalizeTranslations(cityDoc.translations),
      fastFacts: asArray(cityDoc.fastFacts).map((fact) => {
        const record = asRecord(fact);
        return { label: asString(record.label), value: asString(record.value) };
      }),
      sections: emptySections,
      seo: normalizeSeo(
        cityDoc.seo,
        asString(cityDoc.name),
        asString(cityDoc.lede),
      ),
      extractedAt: asString(cityDoc.updatedAt) || new Date(0).toISOString(),
      ...(structuredSections ? { structuredGuide: structuredSections } : {}),
    } satisfies CityShell);
  } catch (error) {
    console.error(`Payload city shell source failed for ${slug}.`, error);
    throw error;
  }
};

const getCityShellBySlug = cache((slug: string) =>
  cacheWithCityTags("shell", slug, () => loadCityShellBySlug(slug)),
);

const loadCityNeighborhoodsBySlug = async (
  slug: string,
): Promise<Neighborhood[]> => {
  if (!assertCmsConfigured()) return getLocalCityBySlug(slug)?.neighborhoods ?? [];

  const shell = await getCityShellBySlug(slug);
  if (!shell?.cityId) return [];

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "neighborhoods" as never,
      depth: 2,
      limit: maxCityCacheCollectionLimit,
      overrideAccess: true,
      where: { city: { equals: shell.cityId } },
    });

    return withCachePayloadTelemetry(
      `city neighborhoods:${slug}`,
      (result.docs as CMSDoc[]).map(normalizeNeighborhood),
    );
  } catch (error) {
    console.error(`Payload city neighborhoods source failed for ${slug}.`, error);
    throw error;
  }
};

const getCityNeighborhoodsBySlug = cache((slug: string) =>
  cacheWithCityTags("neighborhoods", slug, () =>
    loadCityNeighborhoodsBySlug(slug),
  ),
);

const loadCityListingsBySlug = async (slug: string): Promise<Listing[]> => {
  if (!assertCmsConfigured()) return getLocalCityBySlug(slug)?.listings ?? [];

  const shell = await getCityShellBySlug(slug);
  if (!shell?.cityId) return [];

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "listings" as never,
      depth: 2,
      limit: maxCityCacheCollectionLimit,
      overrideAccess: true,
      where: { city: { equals: shell.cityId } },
    });

    return withCachePayloadTelemetry(
      `city listings:${slug}`,
      (result.docs as CMSDoc[]).map(normalizeListing),
    );
  } catch (error) {
    console.error(`Payload city listings source failed for ${slug}.`, error);
    throw error;
  }
};

const getCityListingsBySlug = cache((slug: string) =>
  cacheWithCityTags("listings", slug, () => loadCityListingsBySlug(slug)),
);

const loadCityItinerariesBySlug = async (slug: string): Promise<Itinerary[]> => {
  if (!assertCmsConfigured()) return getLocalCityBySlug(slug)?.itineraries ?? [];

  const shell = await getCityShellBySlug(slug);
  if (!shell?.cityId) return [];

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "itineraries" as never,
      depth: 2,
      limit: maxCityCacheCollectionLimit,
      overrideAccess: true,
      where: { city: { equals: shell.cityId } },
    });

    return withCachePayloadTelemetry(
      `city itineraries:${slug}`,
      (result.docs as CMSDoc[]).map(normalizeItinerary),
    );
  } catch (error) {
    console.error(`Payload city itineraries source failed for ${slug}.`, error);
    throw error;
  }
};

const getCityItinerariesBySlug = cache((slug: string) =>
  cacheWithCityTags("itineraries", slug, () => loadCityItinerariesBySlug(slug)),
);

const loadCityGuideSectionsBySlug = async (
  slug: string,
): Promise<GuideSectionsCacheData> => {
  if (!assertCmsConfigured()) {
    const fallbackCity = getLocalCityBySlug(slug);
    return {
      fullGuide: fallbackCity?.fullGuide,
      translations: fallbackCity?.guideArticleTranslations ?? {},
    };
  }

  const shell = await getCityShellBySlug(slug);
  if (!shell?.cityId) return { translations: {} };

  try {
    const payload = await getPayload({ config });
    const result = await payload.find({
      collection: "guide-sections" as never,
      depth: 0,
      limit: maxCityCacheCollectionLimit,
      overrideAccess: true,
      sort: "id",
      where: { city: { equals: shell.cityId } },
    });
    const docs = result.docs as CMSDoc[];
    const fallbackCity = getLocalCityBySlug(slug);
    const cityDoc = {
      id: shell.cityId,
      name: shell.name,
      slug: shell.slug,
      country: shell.country,
      region: shell.region,
      lastVerifiedAt: shell.lastVerifiedAt,
      updatedAt: shell.extractedAt,
    };

    return withCachePayloadTelemetry(`city guide sections:${slug}`, {
      fullGuide: normalizeCmsGuideSections({
        cityDoc,
        docs,
        fallbackGuide: fallbackCity?.fullGuide,
      }),
      translations: normalizeGuideArticleTranslations(docs),
    });
  } catch (error) {
    console.error(`Payload city guide sections source failed for ${slug}.`, error);
    throw error;
  }
};

const getCityGuideSectionsBySlug = cache((slug: string) =>
  cacheWithCityTags("guide-sections", slug, () =>
    loadCityGuideSectionsBySlug(slug),
  ),
);

const emptyGuideItemsCacheData = (): GuideItemsCacheData => ({
  guideItemGalleries: {},
  guideItemImages: {},
  guideItemNeighborhoods: {},
  guideItems: [],
  translations: {},
  overrides: {},
});

const mergeGuideItemsCacheData = (
  parts: GuideItemsCacheData[],
): GuideItemsCacheData =>
  parts.reduce<GuideItemsCacheData>((merged, part) => ({
    guideItemGalleries: {
      ...merged.guideItemGalleries,
      ...part.guideItemGalleries,
    },
    guideItemImages: { ...merged.guideItemImages, ...part.guideItemImages },
    guideItemNeighborhoods: {
      ...merged.guideItemNeighborhoods,
      ...part.guideItemNeighborhoods,
    },
    guideItems: [...merged.guideItems, ...part.guideItems],
    translations: { ...merged.translations, ...part.translations },
    overrides: { ...merged.overrides, ...part.overrides },
  }), emptyGuideItemsCacheData());

const loadCityGuideItemsByKind = async (
  slug: string,
  kind: CityGuideItem["kind"],
): Promise<GuideItemsCacheData> => {
  if (!assertCmsConfigured()) {
    const fallbackCity = getLocalCityBySlug(slug);
    if (!fallbackCity) return emptyGuideItemsCacheData();

    const guideItems = (fallbackCity.guideItems ?? []).filter(
      (item) => item.kind === kind,
    );
    return {
      guideItemGalleries: fallbackCity.guideItemGalleries ?? {},
      guideItemImages: fallbackCity.guideItemImages ?? {},
      guideItemNeighborhoods: fallbackCity.guideItemNeighborhoods ?? {},
      guideItems,
      translations: fallbackCity.guideItemTranslations ?? {},
      overrides: fallbackCity.guideItemOverrides ?? {},
    };
  }

  const shell = await getCityShellBySlug(slug);
  if (!shell?.cityId) return emptyGuideItemsCacheData();

  try {
    const payload = await getPayload({ config });
    const [guideItemResult, neighborhoodResult] = await Promise.all([
      payload.find({
        collection: "guide-items" as never,
        depth: 0,
        limit: maxCityCacheCollectionLimit,
        overrideAccess: true,
        sort: "id",
        where: {
          and: [
            { city: { equals: shell.cityId } },
            { kind: { equals: kind } },
          ],
        },
      }),
      payload.find({
        collection: "neighborhoods" as never,
        depth: 0,
        limit: maxCityCacheCollectionLimit,
        overrideAccess: true,
        where: { city: { equals: shell.cityId } },
      }),
    ]);
    const guideItemDocs = guideItemResult.docs as CMSDoc[];
    const galleryImageIds = (doc: CMSDoc): (number | string)[] =>
      asArray(doc.gallery)
        .map((entry) => relationshipId(asRecord(entry).image))
        .filter((id): id is number | string => id != null);
    const imageIds = Array.from(
      new Set(
        guideItemDocs.flatMap((doc) =>
          [relationshipId(doc.image), ...galleryImageIds(doc)].filter(
            (id): id is number | string => id != null,
          ),
        ),
      ),
    );
    const mediaUrlById = new Map<number | string, string>();
    if (imageIds.length > 0) {
      const mediaResult = await payload.find({
        collection: "media" as never,
        depth: 0,
        limit: imageIds.length,
        overrideAccess: true,
        where: { id: { in: imageIds } },
      });
      for (const mediaDoc of mediaResult.docs as CMSDoc[]) {
        const url = guideItemMediaUrl(mediaDoc);
        if (url) mediaUrlById.set(mediaDoc.id, url);
      }
    }
    const guideItemImages: Record<string, string> = {};
    const guideItemGalleries: Record<string, string[]> = {};
    const neighborhoodSlugById = new Map<number | string, string>();
    for (const doc of neighborhoodResult.docs as CMSDoc[]) {
      const neighborhoodSlug = asString(doc.slug);
      if (neighborhoodSlug) neighborhoodSlugById.set(doc.id, neighborhoodSlug);
    }
    const guideItemNeighborhoods: Record<string, string> = {};
    for (const doc of guideItemDocs) {
      const itemSlug = asString(doc.slug);
      if (!itemSlug) continue;
      const neighborhoodId = relationshipId(doc.neighborhood);
      const neighborhoodSlug =
        neighborhoodId != null
          ? neighborhoodSlugById.get(neighborhoodId)
          : undefined;
      if (neighborhoodSlug) {
        guideItemNeighborhoods[itemSlug] = neighborhoodSlug;
        guideItemNeighborhoods[`${kind}:${itemSlug}`] = neighborhoodSlug;
      }
      const primaryId = relationshipId(doc.image);
      const primaryUrl =
        primaryId != null ? mediaUrlById.get(primaryId) : undefined;
      const galleryUrls = galleryImageIds(doc)
        .map((id) => mediaUrlById.get(id))
        .filter((url): url is string => Boolean(url));
      const allUrls = Array.from(
        new Set(
          [primaryUrl, ...galleryUrls].filter((url): url is string =>
            Boolean(url),
          ),
        ),
      );
      if (primaryUrl) {
        guideItemImages[itemSlug] = primaryUrl;
        guideItemImages[`${kind}:${itemSlug}`] = primaryUrl;
      }
      if (allUrls.length > 0) {
        guideItemGalleries[itemSlug] = allUrls;
        guideItemGalleries[`${kind}:${itemSlug}`] = allUrls;
      }
    }

    return withCachePayloadTelemetry(`city guide items:${slug}:${kind}`, {
      guideItemGalleries,
      guideItemImages,
      guideItemNeighborhoods,
      guideItems: normalizeGuideItems({
        citySlug: slug,
        docs: guideItemDocs,
        guideItemGalleries,
        guideItemImages,
        guideItemNeighborhoods,
      }),
      translations: normalizeGuideItemTranslations(guideItemDocs),
      overrides: normalizeGuideItemOverrides(guideItemDocs),
    });
  } catch (error) {
    console.error(
      `Payload city guide items source failed for ${slug}/${kind}.`,
      error,
    );
    throw error;
  }
};

const guideItemKinds = Object.keys(
  guideItemFallbackImageByKind,
) as CityGuideItem["kind"][];

const getCityGuideItemsByKind = cache(
  (slug: string, kind: CityGuideItem["kind"]) =>
    unstable_cache(
      () => loadCityGuideItemsByKind(slug, kind),
      ["irhal-city-guide-items-v3", slug, kind],
      {
        revalidate: cityCacheTtlSeconds,
        tags: [
          ...cityCacheTags(slug, "guide-items"),
          `irhal-city-guide-items:${slug}:${kind}`,
        ],
      },
    )(),
);

const getCityGuideItemsBySlug = cache(async (slug: string) =>
  mergeGuideItemsCacheData(
    await Promise.all(guideItemKinds.map((kind) => getCityGuideItemsByKind(slug, kind))),
  ),
);

const loadCityBySlug = async (slug: string): Promise<CityGuide | undefined> => {
  const normalizedSlug = slug.toLowerCase();
  const shell = await getCityShellBySlug(normalizedSlug);
  if (!shell) return undefined;

  if (shell.contentSource === "local") {
    const fallbackCity = getLocalCityBySlug(normalizedSlug);
    return fallbackCity ? { ...fallbackCity, contentSource: "local" } : undefined;
  }

  const fallbackCity = getLocalCityBySlug(shell.slug);
  const [
    neighborhoods,
    listings,
    cmsItineraries,
    guideSections,
    guideItems,
  ] = await Promise.all([
    getCityNeighborhoodsBySlug(shell.slug),
    getCityListingsBySlug(shell.slug),
    getCityItinerariesBySlug(shell.slug),
    getCityGuideSectionsBySlug(shell.slug),
    getCityGuideItemsBySlug(shell.slug),
  ]);

  return {
    ...shell,
    neighborhoods,
    listings,
    itineraries: mergeCmsItinerariesWithFallback(
      cmsItineraries,
      fallbackCity?.itineraries,
    ),
    guideArticleTranslations: guideSections.translations,
    guideItemTranslations: guideItems.translations,
    guideItemOverrides: guideItems.overrides,
    guideItemImages: guideItems.guideItemImages,
    guideItemGalleries: guideItems.guideItemGalleries,
    guideItemNeighborhoods: guideItems.guideItemNeighborhoods,
    guideItems: guideItems.guideItems,
    fullGuide:
      guideSections.fullGuide ??
      shell.structuredGuide ??
      emptyGuideImportFromShell(shell),
  } satisfies CityGuide;
};

const requestCachedLoadCityBySlug = cache(loadCityBySlug);

export const getCityBySlug = async (
  slug: string,
): Promise<CityGuide | undefined> => {
  return requestCachedLoadCityBySlug(slug.toLowerCase());
};

export const preloadCityBySlug = (slug: string) => {
  const normalizedSlug = slug.toLowerCase();
  const preload = () =>
    getCityBySlug(normalizedSlug).catch((error) => {
      console.warn(`City preload failed for ${normalizedSlug}.`, error);
    });

  try {
    after(preload);
  } catch {
    void preload();
  }
};
