import config from "@/payload.config";
import { getPayload } from "payload";

import type { CityGuide, CityGuideImport, Itinerary, Listing, ListingType, Neighborhood } from "./city-data";
import { getCityBySlug as getLocalCityBySlug } from "./city-data";

type CMSDoc = Record<string, unknown> & {
  id: number | string;
};

const isCMSConfigured = () => Boolean(process.env.DATABASE_URL && process.env.PAYLOAD_SECRET);

const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const asNumber = (value: unknown, fallback = 0) => (typeof value === "number" ? value : fallback);
const asRecord = (value: unknown): Record<string, unknown> => (value && typeof value === "object" ? (value as Record<string, unknown>) : {});
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

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

const normalizeSeo = (value: unknown, fallbackTitle: string, fallbackDescription: string) => {
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
  const seo = normalizeSeo(doc.seo, asString(doc.name), asString(doc.shortDescription));
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
      halalCertification: asString(muslimTravel.halalCertification) || undefined,
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

export const getCityBySlug = async (slug: string): Promise<CityGuide | undefined> => {
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
    const [neighborhoodResult, listingResult, itineraryResult] = await Promise.all([
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
    ]);

    const structuredSections = cityDoc.structuredSections as CityGuideImport | undefined;

    return {
      slug: asString(cityDoc.slug),
      name: asString(cityDoc.name),
      country: relationshipName(cityDoc.country, fallbackCity?.country),
      region: asString(cityDoc.region, fallbackCity?.region),
      locale: asString(cityDoc.locale, fallbackCity?.locale ?? "en"),
      lede: asString(cityDoc.lede, fallbackCity?.lede),
      timezone: asString(cityDoc.timezone, fallbackCity?.timezone),
      currency: asString(cityDoc.currency, fallbackCity?.currency),
      languages: normalizeLanguages(cityDoc.languages),
      latitude: asNumber(cityDoc.latitude, fallbackCity?.latitude),
      longitude: asNumber(cityDoc.longitude, fallbackCity?.longitude),
      mapUrl: asString(cityDoc.mapUrl, fallbackCity?.mapUrl),
      lastVerifiedAt: asString(cityDoc.lastVerifiedAt, fallbackCity?.lastVerifiedAt),
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
      neighborhoods: (neighborhoodResult.docs as CMSDoc[]).map(normalizeNeighborhood),
      listings: (listingResult.docs as CMSDoc[]).map(normalizeListing),
      itineraries: (itineraryResult.docs as CMSDoc[]).map(normalizeItinerary),
      seo: normalizeSeo(cityDoc.seo, fallbackCity?.seo.title ?? asString(cityDoc.name), fallbackCity?.seo.description ?? asString(cityDoc.lede)),
      fullGuide: structuredSections ?? fallbackCity?.fullGuide,
    } as CityGuide;
  } catch (error) {
    console.warn(`Payload city source failed for ${slug}; falling back to local import.`, error);
    return fallbackCity;
  }
};
