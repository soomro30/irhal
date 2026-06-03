import config from "@/payload.config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

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

type CMSDoc = Record<string, unknown> & {
  id: number | string;
};

export type CityNavItem = {
  country: string;
  heroImageUrl?: string;
  name: string;
  slug: string;
};

const isProduction = process.env.NODE_ENV === "production";
const defaultCityCacheTtlSeconds =
  process.env.NODE_ENV === "development" ? 5 : 60;
const cityCacheTtlSeconds = Number(
  process.env.IRHAL_CITY_CACHE_SECONDS ?? defaultCityCacheTtlSeconds,
);

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

const guideItemFallbackImageByKind: Record<CityGuideItem["kind"], string> = {
  family: "/images/karachi-guide/family.svg",
  festival: "/images/karachi-guide/festival.svg",
  hotel: "/images/karachi-guide/hotel.svg",
  masjid: "/images/karachi-guide/masjid.svg",
  place: "/images/karachi-guide/place.svg",
  restaurant: "/images/karachi-guide/restaurant.svg",
  shopping: "/images/karachi-guide/shopping.svg",
  tour: "/images/karachi-guide/tour.svg",
};

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

const mediaUrl = (value: unknown) => {
  const media = asRecord(value);
  const sizes = asRecord(media.sizes);
  const hero = asRecord(sizes.hero);
  const card = asRecord(sizes.card);
  return asString(media.url) || asString(hero.url) || asString(card.url);
};

const guideItemMediaUrl = (value: unknown) => {
  const media = asRecord(value);
  const usageStatus = asString(media.usageStatus);
  if (usageStatus === "needs-replacement" || usageStatus === "archived") {
    return undefined;
  }

  return mediaUrl(media);
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

const emptyGuideImport = (doc: CMSDoc): CityGuideImport => {
  const name = asString(doc.name);
  const slug = asString(doc.slug);

  return {
    source: {
      fileName: "payload",
      extractedAt: asString(doc.updatedAt) || new Date(0).toISOString(),
      formatVersion: "payload",
    },
    city: {
      name,
      slug,
      country: relationshipName(doc.country),
      region: asString(doc.region),
      updatedLabel: asString(doc.lastVerifiedAt),
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
  };
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
  days: asArray(doc.days).map((item) => {
    const day = asRecord(item);
    return {
      dayNumber: asNumber(day.dayNumber, 1),
      theme: asString(day.theme),
      stops: asArray(day.stops)
        .map((stop) => {
          if (typeof stop === "string") return stop;
          return asString(asRecord(stop).slug);
        })
        .filter(Boolean),
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
    country: city.country,
    heroImageUrl: city.heroImageUrl,
    name: city.name,
    slug: city.slug,
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
          country: relationshipName(doc.country),
          heroImageUrl: mediaUrl(doc.heroImage) || undefined,
          name: asString(doc.name),
          slug,
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
  ["irhal-city-nav-v2"],
  {
    revalidate: cityCacheTtlSeconds,
    tags: ["irhal-city-nav", "irhal-city"],
  },
);

export const getCityNavItems = async (): Promise<CityNavItem[]> =>
  cachedLoadCityNavItems();

const loadCityBySlug = async (slug: string): Promise<CityGuide | undefined> => {
  if (!isCMSConfigured()) {
    if (isProduction) {
      throw new Error(
        "Payload CMS is not configured in production. DATABASE_URL and PAYLOAD_SECRET are required.",
      );
    }

    const fallbackCity = getLocalCityBySlug(slug);
    return fallbackCity ? { ...fallbackCity, contentSource: "local" } : undefined;
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
    const cityHeroImageUrl = mediaUrl(cityDoc.heroImage);
    const cityHeroGalleryImageIds = cityHeroGalleryIds();
    const cityHeroGalleryUrls = asArray(cityDoc.heroGallery)
      .map((entry) => mediaUrl(asRecord(entry).image))
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
        const url = mediaUrl(mediaDoc);
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
    const [
      neighborhoodResult,
      listingResult,
      itineraryResult,
      guideItemResult,
      guideSectionResult,
    ] =
      await Promise.all([
        payload.find({
          collection: "neighborhoods" as never,
          depth: 2,
          limit: 300,
          overrideAccess: true,
          where: { city: { equals: cityId } },
        }),
        payload.find({
          collection: "listings" as never,
          depth: 2,
          limit: 500,
          overrideAccess: true,
          where: { city: { equals: cityId } },
        }),
        payload.find({
          collection: "itineraries" as never,
          depth: 2,
          limit: 100,
          overrideAccess: true,
          where: { city: { equals: cityId } },
        }),
        payload.find({
          collection: "guide-items" as never,
          depth: 0,
          limit: 700,
          overrideAccess: true,
          sort: "id",
          where: { city: { equals: cityId } },
        }),
        payload.find({
          collection: "guide-sections" as never,
          depth: 0,
          limit: 100,
          overrideAccess: true,
          sort: "id",
          where: { city: { equals: cityId } },
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
      const slug = asString(doc.slug);
      if (!slug) continue;
      const kind = asString(doc.kind);
      const neighborhoodId = relationshipId(doc.neighborhood);
      const neighborhoodSlug =
        neighborhoodId != null
          ? neighborhoodSlugById.get(neighborhoodId)
          : undefined;
      if (neighborhoodSlug) {
        guideItemNeighborhoods[slug] = neighborhoodSlug;
        if (kind) guideItemNeighborhoods[`${kind}:${slug}`] = neighborhoodSlug;
      }
      const primaryId = relationshipId(doc.image);
      const primaryUrl =
        primaryId != null ? mediaUrlById.get(primaryId) : undefined;
      const galleryUrls = galleryImageIds(doc)
        .map((id) => mediaUrlById.get(id))
        .filter((url): url is string => Boolean(url));
      // Full ordered set: primary first, then gallery (deduped).
      const allUrls = Array.from(
        new Set([primaryUrl, ...galleryUrls].filter((url): url is string => Boolean(url))),
      );
      if (primaryUrl) {
        guideItemImages[slug] = primaryUrl;
        if (kind) guideItemImages[`${kind}:${slug}`] = primaryUrl;
      }
      if (allUrls.length > 0) {
        guideItemGalleries[slug] = allUrls;
        if (kind) guideItemGalleries[`${kind}:${slug}`] = allUrls;
      }
    }

    const fallbackCity = getLocalCityBySlug(asString(cityDoc.slug));
    const structuredSections = normalizeStructuredGuideImport(
      cityDoc.structuredSections,
    );
    const cmsGuideSections = normalizeCmsGuideSections({
      cityDoc,
      docs: guideSectionResult.docs as CMSDoc[],
      fallbackGuide: fallbackCity?.fullGuide,
    });
    const cmsItineraries = (itineraryResult.docs as CMSDoc[]).map(
      normalizeItinerary,
    );

    return {
      contentSource: "payload",
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
      guideItemTranslations: normalizeGuideItemTranslations(
        guideItemResult.docs as CMSDoc[],
      ),
      guideArticleTranslations: normalizeGuideArticleTranslations(
        guideSectionResult.docs as CMSDoc[],
      ),
      guideItemOverrides: normalizeGuideItemOverrides(guideItemDocs),
      guideItemImages,
      guideItemGalleries,
      guideItemNeighborhoods,
      guideItems: normalizeGuideItems({
        citySlug: asString(cityDoc.slug),
        docs: guideItemDocs,
        guideItemGalleries,
        guideItemImages,
        guideItemNeighborhoods,
      }),
      fastFacts: asArray(cityDoc.fastFacts).map((fact) => {
        const record = asRecord(fact);
        return { label: asString(record.label), value: asString(record.value) };
      }),
      sections: emptySections,
      neighborhoods: (neighborhoodResult.docs as CMSDoc[]).map(
        normalizeNeighborhood,
      ),
      listings: (listingResult.docs as CMSDoc[]).map(normalizeListing),
      itineraries: mergeCmsItinerariesWithFallback(
        cmsItineraries,
        fallbackCity?.itineraries,
      ),
      seo: normalizeSeo(
        cityDoc.seo,
        asString(cityDoc.name),
        asString(cityDoc.lede),
      ),
      fullGuide:
        cmsGuideSections ?? structuredSections ?? emptyGuideImport(cityDoc),
    } as CityGuide;
  } catch (error) {
    console.error(`Payload city source failed for ${slug}.`, error);
    throw error;
  }
};

const cachedLoadCityBySlug = unstable_cache(
  loadCityBySlug,
  ["irhal-city-by-slug-v5"],
  {
    revalidate: cityCacheTtlSeconds,
    tags: ["irhal-city"],
  },
);

export const getCityBySlug = async (
  slug: string,
): Promise<CityGuide | undefined> => {
  return cachedLoadCityBySlug(slug.toLowerCase());
};

export const preloadCityBySlug = (slug: string) => {
  void getCityBySlug(slug).catch((error) => {
    console.warn(`City preload failed for ${slug}.`, error);
  });
};
