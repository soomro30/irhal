import { getPayload } from "payload";

import config from "../src/payload.config";
import { cities } from "../src/lib/city-data";
import { getGuideArticlesForSection, getGuideItems, sectionCards, slugifyGuideItem } from "../src/lib/guide-items";

type PayloadDoc = {
  id: number | string;
};

const city = cities.find((item) => item.slug === "karachi");

if (!city) {
  throw new Error("Karachi guide data was not found.");
}

const databaseUrl = process.env.DATABASE_URL?.includes("<") ? "" : process.env.DATABASE_URL;

if (!databaseUrl || !process.env.PAYLOAD_SECRET) {
  throw new Error(
    "A real DATABASE_URL and PAYLOAD_SECRET are required to seed Payload CMS documents. Replace <DATABASE_PASSWORD> in .env.local or paste the full Supabase connection string.",
  );
}

const payload = await getPayload({ config });

const source = {
  label: city.fullGuide.source.fileName,
  url: "local-docx-import",
  type: "editorial",
  verifiedAt: "2026-05-25",
  confidence: "high",
};

const upsertByWhere = async ({
  collection,
  data,
  where,
}: {
  collection: string;
  data: Record<string, unknown>;
  where: Record<string, unknown>;
}): Promise<PayloadDoc> => {
  const existing = await payload.find({
    collection: collection as never,
    limit: 1,
    overrideAccess: true,
    where: where as never,
  });
  const existingDoc = existing.docs[0] as PayloadDoc | undefined;

  if (existingDoc) {
    return (await payload.update({
      collection: collection as never,
      data: data as never,
      id: existingDoc.id,
      overrideAccess: true,
    })) as PayloadDoc;
  }

  return (await payload.create({
    collection: collection as never,
    data: data as never,
    overrideAccess: true,
  })) as PayloadDoc;
};

const countryDoc = await upsertByWhere({
  collection: "countries",
  where: {
    slug: {
      equals: "pakistan",
    },
  },
  data: {
    name: "Pakistan",
    slug: "pakistan",
    iso2: "PK",
    iso3: "PAK",
    region: "Asia",
    subregion: "Southern Asia",
    capital: "Islamabad",
    currency: city.currency,
    languages: city.languages.map((language) => ({ language })),
    callingCodes: [{ code: "+92" }],
    summary: "Pakistan country record for Irhal city guides, beginning with the Karachi enterprise guide model.",
    flagEmoji: "PK",
    workflowStatus: "published",
    seo: {
      title: "Pakistan Travel Guides | Irhal AI Travel",
      description: "Structured Irhal travel guides for cities in Pakistan.",
      robots: "index,follow",
      schemaType: "Country",
    },
    sources: [source],
    lastVerifiedAt: "2026-05-25",
  },
});

const cityDoc = await upsertByWhere({
  collection: "cities",
  where: {
    slug: {
      equals: city.slug,
    },
  },
  data: {
    name: city.name,
    slug: city.slug,
    country: countryDoc.id,
    region: city.region,
    locale: city.locale,
    lede: city.lede,
    timezone: city.timezone,
    languages: city.languages.map((language) => ({ language })),
    currency: city.currency,
    latitude: city.latitude,
    longitude: city.longitude,
    geo: [city.longitude, city.latitude],
    mapUrl: city.mapUrl,
    fastFacts: city.fastFacts,
    structuredSections: city.fullGuide,
    workflowStatus: "published",
    seo: city.seo,
    sources: [source],
    lastVerifiedAt: "2026-05-25",
  },
});

const districtIds = new Map<string, number | string>();

for (const neighborhood of city.neighborhoods) {
  const districtSlug = slugifyGuideItem(neighborhood.district);
  const districtDoc = await upsertByWhere({
    collection: "districts",
    where: {
      and: [{ slug: { equals: districtSlug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      name: neighborhood.district,
      slug: districtSlug,
      city: cityDoc.id,
      zone: neighborhood.zone,
      summary: `${neighborhood.district} district cluster for ${city.name}, seeded from the Karachi V4 neighborhood operating guide.`,
      latitude: neighborhood.latitude,
      longitude: neighborhood.longitude,
      geo: [neighborhood.longitude, neighborhood.latitude],
      mapUrl: neighborhood.mapUrl,
      workflowStatus: "published",
      sources: [source],
    },
  });
  districtIds.set(districtSlug, districtDoc.id);
}

const neighborhoodIds = new Map<string, number | string>();

for (const neighborhood of city.neighborhoods) {
  const districtSlug = slugifyGuideItem(neighborhood.district);
  const neighborhoodDoc = await upsertByWhere({
    collection: "neighborhoods",
    where: {
      and: [{ slug: { equals: neighborhood.slug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      name: neighborhood.name,
      slug: neighborhood.slug,
      city: cityDoc.id,
      district: districtIds.get(districtSlug),
      clusterType: neighborhood.clusterType,
      operatingGuide: neighborhood.operatingGuide,
      bestFor: neighborhood.bestFor.map((value) => ({ value })),
      latitude: neighborhood.latitude,
      longitude: neighborhood.longitude,
      geo: [neighborhood.longitude, neighborhood.latitude],
      mapUrl: neighborhood.mapUrl,
      liveMapQueries: neighborhood.liveMapQueries,
      workflowStatus: "published",
      seo: {
        title: `${neighborhood.name} ${city.name} Travel Guide`,
        description: neighborhood.operatingGuide,
        robots: "index,follow",
        schemaType: "Place",
      },
      sources: [source],
    },
  });
  neighborhoodIds.set(neighborhood.slug, neighborhoodDoc.id);
}

const listingIds = new Map<string, number | string>();

for (const listing of city.listings) {
  const listingDoc = await upsertByWhere({
    collection: "listings",
    where: {
      and: [{ slug: { equals: listing.slug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      name: listing.name,
      slug: listing.slug,
      listingType: listing.listingType,
      city: cityDoc.id,
      neighborhood: neighborhoodIds.get(listing.neighborhoodSlug),
      shortDescription: listing.shortDescription,
      address: listing.address,
      latitude: listing.latitude,
      longitude: listing.longitude,
      geo: [listing.longitude, listing.latitude],
      mapUrl: listing.mapUrl,
      phone: listing.phone,
      website: listing.website,
      priceRange: listing.priceRange,
      affiliateUrl: listing.affiliateUrl,
      muslimTravel: listing.muslimTravel,
      workflowStatus: "published",
      seo: {
        title: listing.seo.title,
        description: listing.seo.description,
        robots: "index,follow",
        schemaType: listing.seo.schemaType,
      },
      sources: [source],
      lastVerifiedAt: listing.lastVerifiedAt,
    },
  });
  listingIds.set(listing.slug, listingDoc.id);
}

const sectionIds = new Map<string, number | string>();

for (const section of sectionCards) {
  const articles = getGuideArticlesForSection(city, section.slug);
  const sectionDoc = await upsertByWhere({
    collection: "guide-sections",
    where: {
      and: [{ sectionSlug: { equals: section.slug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      title: section.title,
      sectionSlug: section.slug,
      city: cityDoc.id,
      sectionType: ["places-to-visit", "hotels", "food-and-restaurants", "shopping", "organized-tours", "children-in-tow", "muslim-visitor-information"].includes(
        section.slug,
      )
        ? "directory"
        : "editorial",
      summary: section.summary,
      sourceImport: {
        articles: articles.map((article) => ({
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          blocks: article.blocks,
        })),
        sourceFile: city.fullGuide.source.fileName,
      },
      workflowStatus: "published",
      seo: {
        title: `${section.title} | ${city.name}`,
        description: section.summary,
        robots: "index,follow",
        schemaType: "Article",
      },
      sources: [source],
    },
  });
  sectionIds.set(section.slug, sectionDoc.id);
}

const guideItems = getGuideItems(city);

for (const item of guideItems) {
  await upsertByWhere({
    collection: "guide-items",
    where: {
      and: [{ kind: { equals: item.kind } }, { slug: { equals: item.slug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      title: item.title,
      slug: item.slug,
      kind: item.kind,
      city: cityDoc.id,
      section: sectionIds.get(item.sectionSlug),
      sectionSlug: item.sectionSlug,
      summary: item.description,
      imageAlt: item.imageAlt,
      area: item.area,
      category: item.category,
      budget: item.budget,
      mapUrl: item.mapUrl,
      geoStatus: item.geoStatus,
      importedDetails: item.details,
      sourceTable: item.sourceTable,
      sourceRowId: item.id,
      workflowStatus: "published",
      seo: {
        title: `${item.title} | ${city.name}`,
        description: item.description,
        robots: "index,follow",
        schemaType:
          item.kind === "restaurant" ? "Restaurant" : item.kind === "hotel" ? "Hotel" : item.kind === "festival" ? "Event" : "Place",
      },
      sources: [
        {
          ...source,
          confidence: "medium",
        },
      ],
    },
  });
}

for (const itinerary of city.itineraries) {
  await upsertByWhere({
    collection: "itineraries",
    where: {
      and: [{ slug: { equals: itinerary.slug } }, { city: { equals: cityDoc.id } }],
    },
    data: {
      title: itinerary.title,
      slug: itinerary.slug,
      city: cityDoc.id,
      durationDays: itinerary.durationDays,
      audience: itinerary.audience,
      summary: itinerary.summary,
      days: itinerary.days.map((day) => ({
        dayNumber: day.dayNumber,
        theme: day.theme,
        stops: day.stops.map((stopSlug) => listingIds.get(stopSlug)).filter(Boolean),
        routeNotes: day.routeNotes,
      })),
      workflowStatus: "published",
      seo: {
        title: `${itinerary.title} | ${city.name}`,
        description: itinerary.summary,
        robots: "index,follow",
        schemaType: "TravelAction",
      },
      sources: [source],
    },
  });
}

console.log(
  `Seeded Payload CMS: 1 country, 1 city, ${districtIds.size} districts, ${neighborhoodIds.size} neighborhoods, ${listingIds.size} listings, ${sectionCards.length} guide sections, ${guideItems.length} guide items, and ${city.itineraries.length} itineraries for ${city.name}.`,
);
