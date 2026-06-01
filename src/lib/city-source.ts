import config from "@/payload.config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

import type {
  CityGuide,
  CityGuideImport,
  CityGuideItem,
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

type CityCacheEntry = {
  expiresAt: number;
  value: CityGuide | undefined;
};

export type CityNavItem = {
  country: string;
  heroImageUrl?: string;
  name: string;
  slug: string;
};

const cityCache = new Map<string, CityCacheEntry>();
const cityRequests = new Map<string, Promise<CityGuide | undefined>>();
const defaultCityCacheTtlSeconds =
  process.env.NODE_ENV === "development" ? 5 : 1800;
const cityCacheTtlSeconds = Number(
  process.env.IRHAL_CITY_CACHE_SECONDS ?? defaultCityCacheTtlSeconds,
);
const cityCacheTtlMs = cityCacheTtlSeconds * 1000;

const isCMSConfigured = () =>
  Boolean(
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes("<") &&
    process.env.PAYLOAD_SECRET,
  );

const asString = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const asNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" ? value : fallback;
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
  if (!isCMSConfigured()) return localCityNavItems();

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
        const fallbackCity = getLocalCityBySlug(slug);

        return {
          country: relationshipName(doc.country, fallbackCity?.country),
          heroImageUrl: mediaUrl(doc.heroImage) || fallbackCity?.heroImageUrl,
          name: asString(doc.name),
          slug,
        };
      })
      .filter((item) => item.name && item.slug);

    return items.length > 0 ? items : localCityNavItems();
  } catch (error) {
    console.warn("Payload city nav source failed; falling back to local cities.", error);
    return localCityNavItems();
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
  const fallbackCity = getLocalCityBySlug(slug);

  if (!isCMSConfigured()) {
    return fallbackCity;
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
    if (!cityDoc) return fallbackCity;

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
      new Set(
        cmsHeroImageUrls.length > 0
          ? cmsHeroImageUrls
          : (fallbackCity?.heroImageUrls ?? []),
      ),
    );
    const [
      neighborhoodResult,
      listingResult,
      itineraryResult,
      guideItemResult,
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
        const url = mediaUrl(mediaDoc);
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

    const structuredSections = cityDoc.structuredSections as
      | CityGuideImport
      | undefined;

    return {
      slug: asString(cityDoc.slug),
      name: asString(cityDoc.name),
      country: relationshipName(cityDoc.country, fallbackCity?.country),
      region: asString(cityDoc.region, fallbackCity?.region),
      locale: asString(cityDoc.locale, fallbackCity?.locale ?? "en"),
      lede: asString(cityDoc.lede, fallbackCity?.lede),
      heroImageUrl: cityHeroImageUrl || fallbackCity?.heroImageUrl,
      heroImageUrls: heroImageUrls.length > 0 ? heroImageUrls : undefined,
      timezone: asString(cityDoc.timezone, fallbackCity?.timezone),
      currency: asString(cityDoc.currency, fallbackCity?.currency),
      languages: normalizeLanguages(cityDoc.languages),
      latitude: asNumber(cityDoc.latitude, fallbackCity?.latitude),
      longitude: asNumber(cityDoc.longitude, fallbackCity?.longitude),
      mapUrl: asString(cityDoc.mapUrl, fallbackCity?.mapUrl),
      lastVerifiedAt: asString(
        cityDoc.lastVerifiedAt,
        fallbackCity?.lastVerifiedAt,
      ),
      translations: normalizeTranslations(cityDoc.translations),
      guideItemTranslations: normalizeGuideItemTranslations(
        guideItemResult.docs as CMSDoc[],
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
      sections: fallbackCity?.sections ?? {
        visitorInformation: "",
        climateWhenToGo: "",
        transportSystem: "",
        festivalsEvents: "",
        healthSafety: "",
        muslimTravel: "",
      },
      neighborhoods: (neighborhoodResult.docs as CMSDoc[]).map(
        normalizeNeighborhood,
      ),
      listings: (listingResult.docs as CMSDoc[]).map(normalizeListing),
      itineraries: (itineraryResult.docs as CMSDoc[]).map(normalizeItinerary),
      seo: normalizeSeo(
        cityDoc.seo,
        fallbackCity?.seo.title ?? asString(cityDoc.name),
        fallbackCity?.seo.description ?? asString(cityDoc.lede),
      ),
      fullGuide: structuredSections ?? fallbackCity?.fullGuide,
    } as CityGuide;
  } catch (error) {
    console.warn(
      `Payload city source failed for ${slug}; falling back to local import.`,
      error,
    );
    return fallbackCity;
  }
};

const cachedLoadCityBySlug = unstable_cache(
  loadCityBySlug,
  ["irhal-city-by-slug-v2"],
  {
    revalidate: cityCacheTtlSeconds,
    tags: ["irhal-city"],
  },
);

export const getCityBySlug = async (
  slug: string,
): Promise<CityGuide | undefined> => {
  const cacheKey = slug.toLowerCase();
  const cached = cityCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const inFlight = cityRequests.get(cacheKey);

  if (inFlight) {
    return inFlight;
  }

  const request = cachedLoadCityBySlug(cacheKey)
    .then((city) => {
      cityCache.set(cacheKey, {
        expiresAt: Date.now() + cityCacheTtlMs,
        value: city,
      });
      return city;
    })
    .finally(() => {
      cityRequests.delete(cacheKey);
    });

  cityRequests.set(cacheKey, request);
  return request;
};

export const preloadCityBySlug = (slug: string) => {
  void getCityBySlug(slug).catch((error) => {
    console.warn(`City preload failed for ${slug}.`, error);
  });
};
