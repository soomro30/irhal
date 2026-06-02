import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import {
  assertSafeCityBaselineSeed,
  type SeedDbClient,
} from "./lib/payload-seed-safety";

nextEnv.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: { connectionString: string; ssl?: { rejectUnauthorized: boolean } }) => DbClient;
};

const [{ cities }, guideItemsModule] = await Promise.all([import("../src/lib/city-data"), import("../src/lib/guide-items")]);

const { getGuideArticlesForSection, getGuideItems, getIrhalLegacyArticleUpdate, sectionCards, slugifyGuideItem } = guideItemsModule;

type DbClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
} & SeedDbClient;

type Source = {
  label: string;
  url: string;
  type: string;
  verifiedAt: string;
  confidence: string;
};

const city = cities.find((item) => item.slug === "karachi");
const databaseUrl = process.env.DATABASE_URL?.includes("<") ? "" : process.env.DATABASE_URL;
const allowDestructiveSeed = process.env.IRHAL_ALLOW_DESTRUCTIVE_SEED === "true";

if (!city) {
  throw new Error("Karachi guide data was not found.");
}

if (!databaseUrl || !process.env.PAYLOAD_SECRET) {
  throw new Error("A real DATABASE_URL and PAYLOAD_SECRET are required to seed Payload CMS documents.");
}

const source: Source = {
  label: city.fullGuide.source.fileName,
  url: "local-docx-import",
  type: "editorial",
  verifiedAt: "2026-05-25",
  confidence: "high",
};

const pointSql = "extensions.ST_SetSRID(extensions.ST_MakePoint(($LONGITUDE$)::double precision, ($LATITUDE$)::double precision), 4326)";

const sourceValues = (overrideConfidence?: string) => [
  source.label,
  source.url,
  source.type,
  source.verifiedAt,
  overrideConfidence ?? source.confidence,
];

const guideItemMediaKeyOverrides: Record<string, string[]> = {
  "masjid:memon-masjid": ["masjid-memon-masjid"],
  "place:merewether-clock-tower": [
    "clock-tower-karachi-merewether-wajahatali001",
    "merewether-clock-tower-1",
  ],
  "place:national-museum-of-pakistan": [
    "place-national-museum-of-pakistan",
  ],
};

const guideItemFieldOverrides: Record<
  string,
  {
    category?: string;
  }
> = {
  "place:merewether-clock-tower": {
    category: "Historic landmark",
  },
};

const guideItemFieldOverride = ({
  kind,
  slug,
}: {
  kind: string;
  slug: string;
}) => guideItemFieldOverrides[`${kind}:${slug}`] ?? guideItemFieldOverrides[slug];

const guideItemMediaMatchKeys = ({
  kind,
  slug,
}: {
  kind: string;
  slug: string;
}) =>
  Array.from(
    new Set([
      slug,
      `${kind}-${slug}`,
      ...(guideItemMediaKeyOverrides[`${kind}:${slug}`] ?? []),
      ...(guideItemMediaKeyOverrides[slug] ?? []),
    ]),
  );

const insertSource = async (client: DbClient, tableName: string, parentId: number | string, order = 0, confidence?: string) => {
  await client.query(
    `insert into payload.${tableName}_sources (
      _order,
      _parent_id,
      id,
      label,
      url,
      type,
      verified_at,
      confidence
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [order, parentId, randomUUID(), ...sourceValues(confidence)],
  );
};

const deleteChildRows = async (client: DbClient, tableName: string, parentId: number | string) => {
  await client.query(`delete from payload.${tableName} where _parent_id = $1`, [parentId]);
};

const getExistingId = async (client: DbClient, query: string, values: unknown[]) => {
  const result = await client.query(query, values);
  return result.rows[0]?.id as number | undefined;
};

const upsertCountry = async (client: DbClient) => {
  const existingId = await getExistingId(client, "select id from payload.countries where slug = $1 limit 1", ["pakistan"]);
  const values = [
    "Pakistan",
    "pakistan",
    "PK",
    "PAK",
    "Asia",
    "Southern Asia",
    "Islamabad",
    city.currency,
    "Pakistan country record for Irhal city guides, beginning with the Karachi enterprise guide model.",
    "PK",
    "published",
    "Pakistan Travel Guides | Irhal AI Travel",
    "Structured Irhal travel guides for cities in Pakistan.",
    "index,follow",
    "Country",
    source.verifiedAt,
  ];

  const result = existingId
    ? await client.query(
        `update payload.countries set
          name = $1,
          slug = $2,
          iso2 = $3,
          iso3 = $4,
          region = $5,
          subregion = $6,
          capital = $7,
          currency = $8,
          summary = $9,
          flag_emoji = $10,
          workflow_status = $11,
          seo_title = $12,
          seo_description = $13,
          seo_robots = $14,
          seo_schema_type = $15,
          last_verified_at = $16,
          _status = 'published',
          updated_at = now()
        where id = $17
        returning id`,
        [...values, existingId],
      )
    : await client.query(
        `insert into payload.countries (
          name,
          slug,
          iso2,
          iso3,
          region,
          subregion,
          capital,
          currency,
          summary,
          flag_emoji,
          workflow_status,
          seo_title,
          seo_description,
          seo_robots,
          seo_schema_type,
          last_verified_at,
          _status,
          updated_at,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'published', now(), now())
        returning id`,
        values,
      );

  const countryId = result.rows[0]?.id as number;
  await Promise.all([
    deleteChildRows(client, "countries_languages", countryId),
    deleteChildRows(client, "countries_calling_codes", countryId),
    deleteChildRows(client, "countries_sources", countryId),
  ]);

  for (const [index, language] of city.languages.entries()) {
    await client.query("insert into payload.countries_languages (_order, _parent_id, id, language) values ($1, $2, $3, $4)", [
      index,
      countryId,
      randomUUID(),
      language,
    ]);
  }
  await client.query("insert into payload.countries_calling_codes (_order, _parent_id, id, code) values (0, $1, $2, '+92')", [countryId, randomUUID()]);
  await insertSource(client, "countries", countryId);

  return countryId;
};

const upsertCity = async (client: DbClient, countryId: number) => {
  const existingId = await getExistingId(client, "select id from payload.cities where slug = $1 limit 1", [city.slug]);
  const values = [
    city.name,
    city.slug,
    countryId,
    city.region,
    city.locale,
    city.lede,
    city.timezone,
    city.currency,
    city.latitude,
    city.longitude,
    city.mapUrl,
    JSON.stringify(city.fullGuide),
    "published",
    city.seo.title,
    city.seo.description,
    city.seo.canonicalPath,
    "index,follow",
    city.seo.schemaType,
    city.lastVerifiedAt,
  ];

  const result = existingId
    ? await client.query(
        `update payload.cities set
          name = $1,
          slug = $2,
          country_id = $3,
          region = $4,
          locale = $5,
          lede = $6,
          timezone = $7,
          currency = $8,
          latitude = $9::double precision,
          longitude = $10::double precision,
          geo = ${pointSql.replace("$LONGITUDE$", "$10").replace("$LATITUDE$", "$9")},
          map_url = $11,
          structured_sections = $12::jsonb,
          workflow_status = $13,
          seo_title = $14,
          seo_description = $15,
          seo_canonical_url = $16,
          seo_robots = $17,
          seo_schema_type = $18,
          last_verified_at = $19,
          _status = 'published',
          updated_at = now()
        where id = $20
        returning id`,
        [...values, existingId],
      )
    : await client.query(
        `insert into payload.cities (
          name,
          slug,
          country_id,
          region,
          locale,
          lede,
          timezone,
          currency,
          latitude,
          longitude,
          geo,
          map_url,
          structured_sections,
          workflow_status,
          seo_title,
          seo_description,
          seo_canonical_url,
          seo_robots,
          seo_schema_type,
          last_verified_at,
          _status,
          updated_at,
          created_at
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::double precision, $10::double precision, ${pointSql.replace("$LONGITUDE$", "$10").replace("$LATITUDE$", "$9")}, $11, $12::jsonb, $13, $14, $15, $16, $17, $18, $19, 'published', now(), now())
        returning id`,
        values,
      );

  const cityId = result.rows[0]?.id as number;
  await Promise.all([
    deleteChildRows(client, "cities_languages", cityId),
    deleteChildRows(client, "cities_fast_facts", cityId),
    deleteChildRows(client, "cities_sources", cityId),
  ]);

  for (const [index, language] of city.languages.entries()) {
    await client.query("insert into payload.cities_languages (_order, _parent_id, id, language) values ($1, $2, $3, $4)", [
      index,
      cityId,
      randomUUID(),
      language,
    ]);
  }
  for (const [index, fact] of city.fastFacts.entries()) {
    await client.query("insert into payload.cities_fast_facts (_order, _parent_id, id, label, value) values ($1, $2, $3, $4, $5)", [
      index,
      cityId,
      randomUUID(),
      fact.label,
      fact.value,
    ]);
  }
  await insertSource(client, "cities", cityId);

  return cityId;
};

const replaceCityChildrenBulk = async (client: DbClient, cityId: number) => {
  const districtRows = Array.from(
    new Map(
      city.neighborhoods.map((neighborhood) => [
        slugifyGuideItem(neighborhood.district),
        {
          name: neighborhood.district,
          slug: slugifyGuideItem(neighborhood.district),
          city_id: cityId,
          zone: neighborhood.zone,
          summary: `${neighborhood.district} district cluster for ${city.name}, seeded from the Karachi V4 neighborhood operating guide.`,
          latitude: neighborhood.latitude,
          longitude: neighborhood.longitude,
          map_url: neighborhood.mapUrl,
        },
      ]),
    ).values(),
  );
  const neighborhoodRows = city.neighborhoods.map((neighborhood) => ({
    name: neighborhood.name,
    slug: neighborhood.slug,
    city_id: cityId,
    district_slug: slugifyGuideItem(neighborhood.district),
    cluster_type: neighborhood.clusterType,
    operating_guide: neighborhood.operatingGuide,
    best_for: neighborhood.bestFor,
    latitude: neighborhood.latitude,
    longitude: neighborhood.longitude,
    map_url: neighborhood.mapUrl,
    live_map_queries: neighborhood.liveMapQueries,
    translations: neighborhood.translations ?? {},
    seo_title: `${neighborhood.name} ${city.name} Travel Guide`,
    seo_description: neighborhood.operatingGuide,
  }));
  const listingRows = city.listings.map((listing) => ({
    name: listing.name,
    slug: listing.slug,
    listing_type: listing.listingType,
    city_id: cityId,
    neighborhood_slug: listing.neighborhoodSlug,
    short_description: listing.shortDescription,
    address: listing.address,
    latitude: listing.latitude,
    longitude: listing.longitude,
    map_url: listing.mapUrl,
    phone: listing.phone ?? null,
    website: listing.website ?? null,
    price_range: listing.priceRange ?? null,
    affiliate_url: listing.affiliateUrl ?? null,
    muslim_travel_is_halal: listing.muslimTravel?.isHalal ?? false,
    muslim_travel_halal_certification: listing.muslimTravel?.halalCertification ?? null,
    muslim_travel_women_prayer_area: listing.muslimTravel?.womenPrayerArea ?? false,
    muslim_travel_family_friendly: listing.muslimTravel?.familyFriendly ?? false,
    muslim_travel_notes: listing.muslimTravel?.notes ?? null,
    seo_title: listing.seo.title,
    seo_description: listing.seo.description,
    seo_schema_type: listing.seo.schemaType,
    last_verified_at: listing.lastVerifiedAt,
  }));
  const sectionRows = sectionCards.map((section) => {
    const articles = getGuideArticlesForSection(city, section.slug);
    const articlesWithSourceUpdates = articles.map((article) => ({
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      blocks: article.blocks,
      legacyIrhalUpdates: getIrhalLegacyArticleUpdate(section.slug, article.slug),
    }));

    return {
      title: section.title,
      section_slug: section.slug,
      city_id: cityId,
      section_type: ["places-to-visit", "hotels", "food-and-restaurants", "shopping", "organized-tours", "children-in-tow", "muslim-visitor-information"].includes(
        section.slug,
      )
        ? "directory"
        : "editorial",
      summary: section.summary,
      has_legacy_irhal_updates: articlesWithSourceUpdates.some(
        (article) => article.legacyIrhalUpdates.length > 0,
      ),
      source_import: {
        articles: articlesWithSourceUpdates,
        sourceFile: city.fullGuide.source.fileName,
      },
      seo_title: `${section.title} | ${city.name}`,
      seo_description: section.summary,
    };
  });
  const guideItemRows = getGuideItems(city).map((item) => {
    const fieldOverride = guideItemFieldOverride({
      kind: item.kind,
      slug: item.slug,
    });

    return {
    title: item.title,
    slug: item.slug,
    kind: item.kind,
    city_id: cityId,
    section_slug: item.sectionSlug,
    summary: item.description,
    image_alt: item.imageAlt,
    area: item.area ?? null,
    neighborhood_slug: item.neighborhoodSlug ?? null,
    category: fieldOverride?.category ?? item.category ?? null,
    budget: item.budget ?? null,
    map_url: item.mapUrl ?? null,
    geo_status: item.geoStatus,
    imported_details: item.details,
    source_table: item.sourceTable,
    source_row_id: item.id,
    seo_title: `${item.title} | ${city.name}`,
    seo_description: item.description,
    seo_schema_type:
      item.kind === "restaurant" ? "Restaurant" : item.kind === "hotel" ? "Hotel" : item.kind === "festival" ? "Event" : "Place",
    media_match_keys: guideItemMediaMatchKeys({
      kind: item.kind,
      slug: item.slug,
    }),
    };
  });
  const itineraryRows = city.itineraries.map((itinerary) => ({
    title: itinerary.title,
    slug: itinerary.slug,
    city_id: cityId,
    duration_days: itinerary.durationDays,
    audience: itinerary.audience,
    summary: itinerary.summary,
    days: itinerary.days,
    seo_title: `${itinerary.title} | ${city.name}`,
    seo_description: itinerary.summary,
  }));

  const sourceParams = [source.label, source.url, source.type, source.verifiedAt, source.confidence];

  const deleteStatements = [
    `delete from payload._guide_items_v_version_sources where _parent_id in (select id from payload._guide_items_v where version_city_id = $1)`,
    "delete from payload._guide_items_v where version_city_id = $1",
    "delete from payload.guide_items_sources where _parent_id in (select id from payload.guide_items where city_id = $1)",
    "delete from payload.guide_items where city_id = $1",
    "delete from payload.itineraries_rels where parent_id in (select id from payload.itineraries where city_id = $1)",
    "delete from payload.itineraries_days where _parent_id in (select id from payload.itineraries where city_id = $1)",
    "delete from payload.itineraries_sources where _parent_id in (select id from payload.itineraries where city_id = $1)",
    "delete from payload.itineraries where city_id = $1",
    "delete from payload.guide_sections_sources where _parent_id in (select id from payload.guide_sections where city_id = $1)",
    "delete from payload.guide_sections where city_id = $1",
    "delete from payload.listings_sources where _parent_id in (select id from payload.listings where city_id = $1)",
    "delete from payload.listings where city_id = $1",
    "delete from payload.neighborhoods_best_for where _parent_id in (select id from payload.neighborhoods where city_id = $1)",
    "delete from payload.neighborhoods_sources where _parent_id in (select id from payload.neighborhoods where city_id = $1)",
    "delete from payload.neighborhoods where city_id = $1",
    "delete from payload.districts_sources where _parent_id in (select id from payload.districts where city_id = $1)",
    "delete from payload.districts where city_id = $1",
  ];

  for (const statement of deleteStatements) {
    await client.query(statement, [cityId]);
  }

  await client.query("create temporary table seed_districts (slug text primary key, id integer) on commit drop");
  await client.query("create temporary table seed_neighborhoods (slug text primary key, id integer) on commit drop");
  await client.query("create temporary table seed_listings (slug text primary key, id integer) on commit drop");
  await client.query("create temporary table seed_sections (section_slug text primary key, id integer) on commit drop");
  await client.query("create temporary table seed_guide_item_media (slug text, kind text, image_id integer, primary key (slug, kind)) on commit drop");
  await client.query("create temporary table seed_itineraries (slug text primary key, id integer, days jsonb) on commit drop");

  await client.query(
    `insert into seed_guide_item_media (slug, kind, image_id)
     select distinct on (rows.slug, rows.kind)
       rows.slug,
       rows.kind,
       media.id
     from jsonb_to_recordset($1::jsonb) as rows (
       slug text,
       kind text,
       media_match_keys jsonb
     )
     cross join lateral jsonb_array_elements_text(rows.media_match_keys) with ordinality as media_key(value, ordinality)
     join payload.media media
       on regexp_replace(
         lower(media.filename),
         '(-[0-9]+x[0-9]+)?\\.(webp|jpg|jpeg|png)$',
         ''
       ) = media_key.value
     order by rows.slug, rows.kind, media_key.ordinality, media.id
     on conflict (slug, kind) do update
       set image_id = excluded.image_id`,
    [
      JSON.stringify(
        guideItemRows.map((row) => ({
          slug: row.slug,
          kind: row.kind,
          media_match_keys: row.media_match_keys,
        })),
      ),
    ],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         name text,
         slug text,
         city_id integer,
         zone text,
         summary text,
         latitude double precision,
         longitude double precision,
         map_url text
       )
     ),
     inserted as (
       insert into payload.districts (
         name,
         slug,
         city_id,
         zone,
         summary,
         latitude,
         longitude,
         geo,
         map_url,
         workflow_status,
         updated_at,
         created_at
       )
       select
         name,
         slug,
         city_id,
         zone::payload.enum_districts_zone,
         summary,
         latitude,
         longitude,
         extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326),
         map_url,
         'published',
         now(),
         now()
       from rows
       returning id, slug
     ),
     source_rows as (
       insert into payload.districts_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
       select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_districts_sources_type, $5::timestamptz, $6::payload.enum_districts_sources_confidence
       from inserted
     )
     insert into seed_districts (slug, id)
     select slug, id from inserted`,
    [JSON.stringify(districtRows), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         name text,
         slug text,
         city_id integer,
         district_slug text,
         cluster_type text,
         operating_guide text,
         best_for jsonb,
         latitude double precision,
         longitude double precision,
         map_url text,
         live_map_queries jsonb,
         translations jsonb,
         seo_title text,
         seo_description text
       )
     ),
     inserted as (
       insert into payload.neighborhoods (
         name,
         slug,
         city_id,
         district_id,
         cluster_type,
         operating_guide,
         latitude,
         longitude,
         geo,
         map_url,
         live_map_queries,
         translations,
         workflow_status,
         seo_title,
         seo_description,
         seo_robots,
         seo_schema_type,
         updated_at,
         created_at
       )
       select
         rows.name,
         rows.slug,
         rows.city_id,
         seed_districts.id,
         rows.cluster_type::payload.enum_neighborhoods_cluster_type,
         rows.operating_guide,
         rows.latitude,
         rows.longitude,
         extensions.ST_SetSRID(extensions.ST_MakePoint(rows.longitude, rows.latitude), 4326),
         rows.map_url,
         rows.live_map_queries,
         rows.translations,
         'published',
         rows.seo_title,
         rows.seo_description,
         'index,follow',
         'Place',
         now(),
         now()
       from rows
       join seed_districts on seed_districts.slug = rows.district_slug
       returning id, slug
     ),
     best_for_rows as (
       insert into payload.neighborhoods_best_for (_order, _parent_id, id, value)
       select (value_item.ordinality - 1)::integer, inserted.id, gen_random_uuid()::text, value_item.value
       from rows
       join inserted on inserted.slug = rows.slug
       cross join lateral jsonb_array_elements_text(rows.best_for) with ordinality as value_item(value, ordinality)
     ),
     source_rows as (
       insert into payload.neighborhoods_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
       select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_neighborhoods_sources_type, $5::timestamptz, $6::payload.enum_neighborhoods_sources_confidence
       from inserted
     )
     insert into seed_neighborhoods (slug, id)
     select slug, id from inserted`,
    [JSON.stringify(neighborhoodRows), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         name text,
         slug text,
         listing_type text,
         city_id integer,
         neighborhood_slug text,
         short_description text,
         address text,
         latitude double precision,
         longitude double precision,
         map_url text,
         phone text,
         website text,
         price_range text,
         affiliate_url text,
         muslim_travel_is_halal boolean,
         muslim_travel_halal_certification text,
         muslim_travel_women_prayer_area boolean,
         muslim_travel_family_friendly boolean,
         muslim_travel_notes text,
         seo_title text,
         seo_description text,
         seo_schema_type text,
         last_verified_at timestamptz
       )
     ),
     inserted as (
       insert into payload.listings (
         name,
         slug,
         listing_type,
         city_id,
         neighborhood_id,
         short_description,
         address,
         latitude,
         longitude,
         geo,
         map_url,
         phone,
         website,
         price_range,
         affiliate_url,
         muslim_travel_is_halal,
         muslim_travel_halal_certification,
         muslim_travel_women_prayer_area,
         muslim_travel_family_friendly,
         muslim_travel_notes,
         workflow_status,
         seo_title,
         seo_description,
         seo_robots,
         seo_schema_type,
         last_verified_at,
         _status,
         updated_at,
         created_at
       )
       select
         rows.name,
         rows.slug,
         rows.listing_type::payload.enum_listings_listing_type,
         rows.city_id,
         seed_neighborhoods.id,
         rows.short_description,
         rows.address,
         rows.latitude,
         rows.longitude,
         extensions.ST_SetSRID(extensions.ST_MakePoint(rows.longitude, rows.latitude), 4326),
         rows.map_url,
         rows.phone,
         rows.website,
         rows.price_range,
         rows.affiliate_url,
         rows.muslim_travel_is_halal,
         rows.muslim_travel_halal_certification,
         rows.muslim_travel_women_prayer_area,
         rows.muslim_travel_family_friendly,
         rows.muslim_travel_notes,
         'published',
         rows.seo_title,
         rows.seo_description,
         'index,follow',
         rows.seo_schema_type,
         rows.last_verified_at,
         'published',
         now(),
         now()
       from rows
       join seed_neighborhoods on seed_neighborhoods.slug = rows.neighborhood_slug
       returning id, slug
     ),
     source_rows as (
       insert into payload.listings_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
       select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_listings_sources_type, $5::timestamptz, $6::payload.enum_listings_sources_confidence
       from inserted
     )
     insert into seed_listings (slug, id)
     select slug, id from inserted`,
    [JSON.stringify(listingRows), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         title text,
         section_slug text,
         city_id integer,
         section_type text,
         summary text,
         has_legacy_irhal_updates boolean,
         source_import jsonb,
         seo_title text,
         seo_description text
       )
     ),
     inserted as (
       insert into payload.guide_sections (
         title,
         section_slug,
         city_id,
         section_type,
         summary,
         source_import,
         workflow_status,
         seo_title,
         seo_description,
         seo_robots,
         seo_schema_type,
         updated_at,
         created_at
       )
       select
         title,
         section_slug,
         city_id,
         section_type::payload.enum_guide_sections_section_type,
         summary,
         source_import,
         case
           when has_legacy_irhal_updates then 'review'::payload.enum_guide_sections_workflow_status
           else 'published'::payload.enum_guide_sections_workflow_status
         end,
         seo_title,
         seo_description,
         'index,follow',
         'Article',
         now(),
         now()
       from rows
       returning id, section_slug, source_import
     ),
     source_rows as (
       insert into payload.guide_sections_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
       select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_guide_sections_sources_type, $5::timestamptz, $6::payload.enum_guide_sections_sources_confidence
       from inserted
       union all
       select
         update_item.ordinality::integer,
         inserted.id,
         gen_random_uuid()::text,
         update_item.update->>'sourceTitle',
         update_item.update->>'sourceUrl',
         'editorial'::payload.enum_guide_sections_sources_type,
         $5::timestamptz,
         'medium'::payload.enum_guide_sections_sources_confidence
       from inserted
       cross join lateral jsonb_path_query(inserted.source_import, '$.articles[*].legacyIrhalUpdates[*]') with ordinality as update_item(update, ordinality)
     )
     insert into seed_sections (section_slug, id)
     select section_slug, id from inserted`,
    [JSON.stringify(sectionRows), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select *
       from jsonb_to_recordset($1::jsonb) as row_data (
         title text,
         slug text,
         kind text,
         city_id integer,
         section_slug text,
         summary text,
         image_alt text,
         area text,
         neighborhood_slug text,
         category text,
         budget text,
         map_url text,
         geo_status text,
         imported_details jsonb,
         source_table text,
         source_row_id text,
         seo_title text,
         seo_description text,
         seo_schema_type text,
         media_match_keys jsonb
       )
     ),
     inserted as (
       insert into payload.guide_items (
         title,
         slug,
         kind,
         city_id,
         section_id,
         section_slug,
         image_id,
         neighborhood_id,
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
       select
         rows.title,
         rows.slug,
         rows.kind::payload.enum_guide_items_kind,
         rows.city_id,
         seed_sections.id,
         rows.section_slug,
         seed_guide_item_media.image_id,
         seed_neighborhoods.id,
         rows.summary,
         rows.image_alt,
         rows.area,
         rows.category,
         rows.budget,
         rows.map_url,
         rows.geo_status::payload.enum_guide_items_geo_status,
         rows.imported_details,
         rows.source_table,
         rows.source_row_id,
         case
           when rows.imported_details ? 'legacy_irhal_source_url' then 'review'::payload.enum_guide_items_workflow_status
           else 'published'::payload.enum_guide_items_workflow_status
         end,
         rows.seo_title,
         rows.seo_description,
         'index,follow',
         rows.seo_schema_type,
         'published',
         now(),
         now()
       from rows
       left join seed_sections on seed_sections.section_slug = rows.section_slug
       left join seed_guide_item_media
         on seed_guide_item_media.slug = rows.slug
       and seed_guide_item_media.kind = rows.kind
       left join seed_neighborhoods
         on seed_neighborhoods.slug = rows.neighborhood_slug
       returning id, imported_details
     )
     insert into payload.guide_items_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
     select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_guide_items_sources_type, $5::timestamptz, 'medium'::payload.enum_guide_items_sources_confidence
     from inserted
     union all
     select
       1,
       id,
       gen_random_uuid()::text,
       coalesce(imported_details->>'legacy_irhal_source_title', 'Irhal legacy Karachi guide'),
       imported_details->>'legacy_irhal_source_url',
       'editorial'::payload.enum_guide_items_sources_type,
       coalesce(imported_details->>'legacy_irhal_verified_at', $5::text)::timestamptz,
       coalesce(imported_details->>'legacy_irhal_confidence', 'medium')::payload.enum_guide_items_sources_confidence
     from inserted
     where imported_details ? 'legacy_irhal_source_url'`,
    [JSON.stringify(guideItemRows), source.label, source.url, source.type, source.verifiedAt],
  );

  // Payload Admin requests draft-enabled collections with draft=true. Seed a
  // latest version row for every guide item so the Admin list shows all items.
  await client.query(
    `insert into payload._guide_items_v (
       parent_id,
       version_title,
       version_slug,
       version_kind,
       version_city_id,
       version_section_id,
       version_section_slug,
       version_summary,
       version_body,
       version_image_id,
       version_neighborhood_id,
       version_image_alt,
       version_area,
       version_category,
       version_budget,
       version_map_url,
       version_geo_status,
       version_latitude,
       version_longitude,
       version_provider_place_id,
       version_imported_details,
       version_source_table,
       version_source_row_id,
       version_workflow_status,
       version_seo_title,
       version_seo_description,
       version_seo_canonical_url,
       version_seo_open_graph_image_id,
       version_seo_robots,
       version_seo_schema_type,
       version_updated_at,
       version_created_at,
       version__status,
       created_at,
       updated_at,
       snapshot,
       published_locale,
       latest,
       version_translations
     )
     select
       guide_items.id,
       guide_items.title,
       guide_items.slug,
       guide_items.kind::text::payload.enum__guide_items_v_version_kind,
       guide_items.city_id,
       guide_items.section_id,
       guide_items.section_slug,
       guide_items.summary,
       guide_items.body,
       guide_items.image_id,
       guide_items.neighborhood_id,
       guide_items.image_alt,
       guide_items.area,
       guide_items.category,
       guide_items.budget,
       guide_items.map_url,
       guide_items.geo_status::text::payload.enum__guide_items_v_version_geo_status,
       guide_items.latitude,
       guide_items.longitude,
       guide_items.provider_place_id,
       guide_items.imported_details,
       guide_items.source_table,
       guide_items.source_row_id,
       guide_items.workflow_status::text::payload.enum__guide_items_v_version_workflow_status,
       guide_items.seo_title,
       guide_items.seo_description,
       guide_items.seo_canonical_url,
       guide_items.seo_open_graph_image_id,
       guide_items.seo_robots::text::payload.enum__guide_items_v_version_seo_robots,
       guide_items.seo_schema_type,
       guide_items.updated_at,
       guide_items.created_at,
       guide_items._status::text::payload.enum__guide_items_v_version_status,
       now(),
       now(),
       null,
       null,
       true,
       guide_items.translations
     from payload.guide_items
     where guide_items.city_id = $1
       and not exists (
         select 1
         from payload._guide_items_v versions
         where versions.parent_id = guide_items.id
           and versions.latest is true
       )`,
    [cityId],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         title text,
         slug text,
         city_id integer,
         duration_days integer,
         audience text,
         summary text,
         days jsonb,
         seo_title text,
         seo_description text
       )
     ),
     inserted as (
       insert into payload.itineraries (
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
       select title, slug, city_id, duration_days, audience::payload.enum_itineraries_audience, summary, 'published', seo_title, seo_description, 'index,follow', 'TravelAction', now(), now()
       from rows
       returning id, slug
     ),
     itinerary_map as (
       insert into seed_itineraries (slug, id, days)
       select inserted.slug, inserted.id, rows.days
       from inserted
       join rows on rows.slug = inserted.slug
       returning id, days
     ),
     day_rows as (
       insert into payload.itineraries_days (_order, _parent_id, id, day_number, theme, route_notes)
       select
         (day_item.ordinality - 1)::integer,
         itinerary_map.id,
         gen_random_uuid()::text,
         (day_item.day ->> 'dayNumber')::numeric,
         day_item.day ->> 'theme',
         day_item.day ->> 'routeNotes'
       from itinerary_map
       cross join lateral jsonb_array_elements(itinerary_map.days) with ordinality as day_item(day, ordinality)
     ),
     relation_rows as (
       insert into payload.itineraries_rels ("order", parent_id, path, listings_id)
       select
         (stop_item.ordinality - 1)::integer,
         itinerary_map.id,
         'days.' || ((day_item.ordinality - 1)::integer)::text || '.stops',
         seed_listings.id
       from itinerary_map
       cross join lateral jsonb_array_elements(itinerary_map.days) with ordinality as day_item(day, ordinality)
       cross join lateral jsonb_array_elements_text(day_item.day -> 'stops') with ordinality as stop_item(slug, ordinality)
       join seed_listings on seed_listings.slug = stop_item.slug
     )
     insert into payload.itineraries_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
     select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_itineraries_sources_type, $5::timestamptz, $6::payload.enum_itineraries_sources_confidence
     from seed_itineraries`,
    [JSON.stringify(itineraryRows), ...sourceParams],
  );

  return {
    districtCount: districtRows.length,
    neighborhoodCount: neighborhoodRows.length,
    listingCount: listingRows.length,
    sectionCount: sectionRows.length,
    guideItemCount: guideItemRows.length,
    itineraryCount: itineraryRows.length,
  };
};

const validateSeed = async (client: DbClient) => {
  const expected = {
    countries: 1,
    cities: 1,
    districts: 6,
    neighborhoods: city.neighborhoods.length,
    listings: 4,
    guide_sections: sectionCards.length,
    guide_items: getGuideItems(city).length,
    itineraries: city.itineraries.length,
  };

  const actual: Record<string, number> = {};

  for (const tableName of Object.keys(expected)) {
    const result = await client.query(`select count(*)::int as count from payload.${tableName}`);
    actual[tableName] = result.rows[0]?.count as number;
  }

  const mismatches = Object.entries(expected).filter(([tableName, count]) => actual[tableName] !== count);

  if (mismatches.length > 0) {
    throw new Error(`Payload seed validation failed: ${JSON.stringify({ expected, actual })}`);
  }

  return actual;
};

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

await client.connect();

try {
  await assertSafeCityBaselineSeed({
    allowDestructiveSeed,
    cityLabel: city.name,
    citySlug: city.slug,
    client,
    resetCommand: "npm run seed:karachi-guide:reset",
  });
  await client.query("begin");

  const countryId = await upsertCountry(client);
  const cityId = await upsertCity(client, countryId);
  const seedCounts = await replaceCityChildrenBulk(client, cityId);

  await client.query("commit");

  const validation = await validateSeed(client);

  console.log(
    `Seeded Payload schema only: country ${countryId}, city ${cityId}, ${seedCounts.districtCount} districts, ${seedCounts.neighborhoodCount} neighborhoods, ${seedCounts.listingCount} listings, ${seedCounts.sectionCount} guide sections, ${seedCounts.guideItemCount} guide items, and ${seedCounts.itineraryCount} itinerary.`,
  );
  console.log(`Payload validation: ${JSON.stringify(validation)}`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
