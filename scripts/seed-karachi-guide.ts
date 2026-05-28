import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { getPayload } from "payload";

nextEnv.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: { connectionString: string; ssl?: { rejectUnauthorized: boolean } }) => {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (text: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>;
  };
};

const [{ default: config }, { cities }, guideItemsModule] = await Promise.all([
  import("../src/payload.config"),
  import("../src/lib/city-data"),
  import("../src/lib/guide-items"),
]);

const { getGuideArticlesForSection, getGuideItems, sectionCards, slugifyGuideItem } = guideItemsModule;

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
  updateExisting = true,
  where,
}: {
  collection: string;
  data: Record<string, unknown>;
  updateExisting?: boolean;
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
    if (!updateExisting) {
      return existingDoc;
    }

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

const seedLargeGuideDocuments = async ({
  cityId,
  sectionIds,
  listingIds,
}: {
  cityId: number | string;
  sectionIds: Map<string, number | string>;
  listingIds: Map<string, number | string>;
}) => {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });
  const guideItems = getGuideItems(city);

  await client.connect();

  try {
    await client.query("begin");

    await client.query(
      `delete from payload._guide_items_v_version_sources
       where _parent_id in (
         select id from payload._guide_items_v where version_city_id = $1
       )`,
      [cityId],
    );
    await client.query("delete from payload._guide_items_v where version_city_id = $1", [cityId]);
    await client.query(
      `delete from payload.guide_items_sources
       where _parent_id in (
         select id from payload.guide_items where city_id = $1
       )`,
      [cityId],
    );
    await client.query("delete from payload.guide_items where city_id = $1", [cityId]);

    for (const item of guideItems) {
      const schemaType =
        item.kind === "restaurant" ? "Restaurant" : item.kind === "hotel" ? "Hotel" : item.kind === "festival" ? "Event" : "Place";
      const inserted = await client.query(
        `insert into payload.guide_items (
          title,
          slug,
          kind,
          city_id,
          section_id,
          section_slug,
          summary,
          image_alt,
          area,
          category,
          budget,
          map_url,
          geo_status,
          imported_details,
          source_table,
          source_row_id,
          workflow_status,
          seo_title,
          seo_description,
          seo_robots,
          seo_schema_type,
          _status,
          updated_at,
          created_at
        )
        values (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14::jsonb,
          $15, $16, 'published', $17, $18, 'index,follow',
          $19, 'published', now(), now()
        )
        returning id`,
        [
          item.title,
          item.slug,
          item.kind,
          cityId,
          sectionIds.get(item.sectionSlug) ?? null,
          item.sectionSlug,
          item.description,
          item.imageAlt,
          item.area ?? null,
          item.category ?? null,
          item.budget ?? null,
          item.mapUrl ?? null,
          item.geoStatus,
          JSON.stringify(item.details),
          item.sourceTable,
          item.id,
          `${item.title} | ${city.name}`,
          item.description,
          schemaType,
        ],
      );

      const guideItemId = inserted.rows[0]?.id;
      await client.query(
        `insert into payload.guide_items_sources (
          _order,
          _parent_id,
          id,
          label,
          url,
          type,
          verified_at,
          confidence
        )
        values (0, $1, $2, $3, $4, $5, $6, 'medium')`,
        [guideItemId, randomUUID(), source.label, source.url, source.type, source.verifiedAt],
      );
    }

    await client.query(
      `delete from payload.itineraries_rels
       where parent_id in (
         select id from payload.itineraries where city_id = $1
       )`,
      [cityId],
    );
    await client.query(
      `delete from payload.itineraries_days
       where _parent_id in (
         select id from payload.itineraries where city_id = $1
       )`,
      [cityId],
    );
    await client.query(
      `delete from payload.itineraries_sources
       where _parent_id in (
         select id from payload.itineraries where city_id = $1
       )`,
      [cityId],
    );
    await client.query("delete from payload.itineraries where city_id = $1", [cityId]);

    for (const itinerary of city.itineraries) {
      const inserted = await client.query(
        `insert into payload.itineraries (
          title,
          slug,
          city_id,
          duration_days,
          audience,
          summary,
          workflow_status,
          seo_title,
          seo_description,
          seo_robots,
          seo_schema_type,
          updated_at,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, 'published', $7, $8, 'index,follow', 'TravelAction', now(), now())
        returning id`,
        [
          itinerary.title,
          itinerary.slug,
          cityId,
          itinerary.durationDays,
          itinerary.audience,
          itinerary.summary,
          `${itinerary.title} | ${city.name}`,
          itinerary.summary,
        ],
      );
      const itineraryId = inserted.rows[0]?.id;

      for (const [dayIndex, day] of itinerary.days.entries()) {
        await client.query(
          `insert into payload.itineraries_days (
            _order,
            _parent_id,
            id,
            day_number,
            theme,
            route_notes
          )
          values ($1, $2, $3, $4, $5, $6)`,
          [dayIndex, itineraryId, randomUUID(), day.dayNumber, day.theme, day.routeNotes],
        );

        for (const [stopIndex, stopSlug] of day.stops.entries()) {
          const listingId = listingIds.get(stopSlug);

          if (listingId) {
            await client.query(
              `insert into payload.itineraries_rels (
                "order",
                parent_id,
                path,
                listings_id
              )
              values ($1, $2, $3, $4)`,
              [stopIndex, itineraryId, `days.${dayIndex}.stops`, listingId],
            );
          }
        }
      }

      await client.query(
        `insert into payload.itineraries_sources (
          _order,
          _parent_id,
          id,
          label,
          url,
          type,
          verified_at,
          confidence
        )
        values (0, $1, $2, $3, $4, $5, $6, $7)`,
        [itineraryId, randomUUID(), source.label, source.url, source.type, source.verifiedAt, source.confidence],
      );
    }

    await client.query("commit");
    console.log(`Seeded ${guideItems.length} guide items and ${city.itineraries.length} itineraries through Payload's Postgres tables.`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
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
console.log("Seeded country: Pakistan.");

const cityDoc = await upsertByWhere({
  collection: "cities",
  updateExisting: false,
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
console.log(`Seeded city: ${city.name}.`);

const districtIds = new Map<string, number | string>();

for (const neighborhood of city.neighborhoods) {
  const districtSlug = slugifyGuideItem(neighborhood.district);
  const districtDoc = await upsertByWhere({
    collection: "districts",
    updateExisting: false,
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
console.log(`Seeded ${districtIds.size} districts.`);

const neighborhoodIds = new Map<string, number | string>();

for (const neighborhood of city.neighborhoods) {
  const districtSlug = slugifyGuideItem(neighborhood.district);
  const neighborhoodDoc = await upsertByWhere({
    collection: "neighborhoods",
    updateExisting: false,
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
console.log(`Seeded ${neighborhoodIds.size} neighborhoods.`);

const listingIds = new Map<string, number | string>();

for (const listing of city.listings) {
  const listingDoc = await upsertByWhere({
    collection: "listings",
    updateExisting: false,
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
console.log(`Seeded ${listingIds.size} anchor listings.`);

const sectionIds = new Map<string, number | string>();

for (const section of sectionCards) {
  const articles = getGuideArticlesForSection(city, section.slug);
  const sectionDoc = await upsertByWhere({
    collection: "guide-sections",
    updateExisting: false,
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
console.log(`Seeded ${sectionIds.size} guide sections.`);

const guideItems = getGuideItems(city);

await seedLargeGuideDocuments({
  cityId: cityDoc.id,
  sectionIds,
  listingIds,
});

console.log(
  `Seeded Payload CMS: 1 country, 1 city, ${districtIds.size} districts, ${neighborhoodIds.size} neighborhoods, ${listingIds.size} listings, ${sectionCards.length} guide sections, ${guideItems.length} guide items, and ${city.itineraries.length} itineraries for ${city.name}.`,
);

process.exit(0);
