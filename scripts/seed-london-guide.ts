import nextEnv from "@next/env";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

import {
  assertSafeCityBaselineSeed,
  type SeedDbClient,
} from "./lib/payload-seed-safety";
import { londonItineraryDetailsBySlug } from "./lib/london-itinerary-details";

nextEnv.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => DbClient;
};

type DbClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
} & SeedDbClient;

type GuideBlock = {
  type: "paragraph" | "table";
  style?: string;
  text?: string;
  links?: Array<{ text: string; url: string }>;
  purpose?: string;
  rows?: Array<{
    values: Record<string, string>;
    links: Record<string, Array<{ text: string; url: string }>>;
  }>;
};

type LondonGuideData = {
  source: { extractedAt: string; fileName: string; formatVersion: string };
  city: {
    country: string;
    lede: string;
    name: string;
    region: string;
    slug: string;
    updatedLabel: string;
  };
  coverage: Record<string, unknown>;
  fastFacts: Array<{ label: string; value: string }>;
  guideItems: Array<{
    area: string;
    category: string;
    description: string;
    details: Record<string, string>;
    geoStatus: "provider-enrichment-required" | "verified";
    imageAlt: string;
    kind: string;
    mapUrl?: string;
    originalContent?: string[];
    sectionSlug: string;
    slug: string;
    sourceRowId: string;
    sourceTable: string;
    title: string;
  }>;
  itineraries: Array<{
    audience: string;
    days: Array<{
      dayNumber: number;
      description?: string;
      start?: string;
      transport?: string;
      breakfast?: string;
      lunch?: string;
      dinner?: string;
      pacing?: string;
      routeNotes: string;
      stops: string[];
      theme: string;
    }>;
    durationDays: number;
    intro?: string;
    planning?: {
      stay?: string;
      transport?: string;
      meals?: {
        breakfast?: string;
        lunch?: string;
        dinner?: string;
      };
    };
    slug: string;
    summary: string;
    title: string;
  }>;
  sections: Array<{
    articles: Array<{
      blocks: GuideBlock[];
      slug: string;
      summary: string;
      title: string;
    }>;
    blocks: GuideBlock[];
    sectionType: string;
    slug: string;
    summary: string;
    title: string;
  }>;
  tables: GuideBlock[];
};

type Source = {
  confidence: string;
  label: string;
  type: string;
  url: string;
  verifiedAt: string;
};

const databaseUrl = process.env.DATABASE_URL?.includes("<")
  ? ""
  : process.env.DATABASE_URL;
const allowDestructiveSeed = process.env.IRHAL_ALLOW_DESTRUCTIVE_SEED === "true";

if (!databaseUrl || !process.env.PAYLOAD_SECRET) {
  throw new Error(
    "A real DATABASE_URL and PAYLOAD_SECRET are required to seed Payload CMS documents.",
  );
}

const data = JSON.parse(
  await fs.readFile("src/data/london-guide.json", "utf8"),
) as LondonGuideData;

const source: Source = {
  confidence: "high",
  label: data.source.fileName,
  type: "editorial",
  url: "local-docx-import",
  verifiedAt: "2026-05-29",
};

const londonItineraryStopSlugs: Record<string, string[]> = {
  "classic-first-day": [
    "place:westminster-abbey",
    "place:palace-of-westminster-and-elizabeth-tower",
    "place:buckingham-palace",
    "place:trafalgar-square",
    "place:covent-garden",
    "tour:city-of-westminster-royal-walking-route",
  ],
  "muslim-heritage-day": [
    "masjid:east-london-mosque-and-london-muslim-centre",
    "place:whitechapel-road",
    "masjid:brick-lane-jamme-masjid",
    "place:old-spitalfields-market",
    "shopping:whitechapel-market",
    "restaurant:whitechapel-and-brick-lane",
  ],
  "family-museum-day": [
    "family:natural-history-museum",
    "family:science-museum",
    "place:victoria-and-albert-museum",
    "restaurant:comptoir-libanais-south-kensington",
    "restaurant:khan-s-of-kensington",
  ],
  "royal-parks-and-mosque-day": [
    "masjid:london-central-mosque-and-islamic-cultural-centre",
    "tour:regent-s-park-mosque-and-marylebone-route",
    "shopping:oxford-street",
    "shopping:regent-street",
    "place:hyde-park",
    "restaurant:edgware-road-and-bayswater",
  ],
  "greenwich-day": [
    "tour:thames-river-cruise-westminster-to-greenwich",
    "place:cutty-sark",
    "place:national-maritime-museum",
    "place:greenwich-park",
    "place:royal-observatory-greenwich",
    "shopping:greenwich-market",
  ],
  "luxury-shopping-day": [
    "shopping:harrods",
    "shopping:harvey-nichols",
    "shopping:sloane-street",
    "shopping:bond-street-and-new-bond-street",
    "shopping:selfridges",
    "restaurant:mayfair-knightsbridge-and-south-kensington",
  ],
  "east-london-food-and-shopping-day": [
    "place:westfield-stratford-city",
    "shopping:green-street-upton-park",
    "place:whitechapel-road",
    "restaurant:whitechapel-and-brick-lane",
    "restaurant:ilford-lane-and-gants-hill",
    "restaurant:walthamstow-and-leyton",
  ],
  "sports-day": [
    "place:wembley-stadium",
    "tour:wembley-stadium-tour",
    "place:wimbledon-lawn-tennis-museum",
    "tour:wimbledon-tennis-tour",
    "place:the-o2-and-greenwich-peninsula",
    "restaurant:wembley-and-harrow",
  ],
};

const pointSql =
  "extensions.ST_SetSRID(extensions.ST_MakePoint(($LONGITUDE$)::double precision, ($LATITUDE$)::double precision), 4326)";

const sourceValues = (confidence = source.confidence) => [
  source.label,
  source.url,
  source.type,
  source.verifiedAt,
  confidence,
];

const arabicSections: Record<string, { summary: string; title: string }> = {
  "children-in-tow": {
    title: "السفر مع الأطفال في لندن",
    summary:
      "دليل عملي لأبرز المتاحف والحدائق والمساحات العائلية في لندن، مع مراعاة أوقات الصلاة وحركة التنقل واحتياجات الأسر المسلمة.",
  },
  "city-in-a-day-and-longer-itineraries": {
    title: "مسارات يوم واحد وعدة أيام في لندن",
    summary:
      "مسارات مقترحة تجمع بين المعالم الكلاسيكية والتراث الإسلامي والمتاحف والتسوق، مع تنظيم عملي للوقت والتنقل.",
  },
  "city-information": {
    title: "معلومات عن مدينة لندن",
    summary:
      "لمحة تحريرية عن لندن اليوم وتاريخها وسكانها وطابعها الثقافي، مع سياق خاص بالمسافر المسلم.",
  },
  "data-resources-and-update-workflow": {
    title: "مصادر البيانات وسير التحديث",
    summary:
      "طبقات المصادر وقواعد التحقق والتحرير اللازمة للحفاظ على دقة دليل لندن وتحديثه بصورة منتظمة.",
  },
  "festivals-and-annual-events": {
    title: "المهرجانات والفعاليات السنوية",
    summary:
      "أبرز فعاليات لندن على مدار العام، مع ملاحظات عملية للأسر والمسافرين المسلمين عند التخطيط للمواسم المزدحمة.",
  },
  "food-and-restaurants": {
    title: "المطاعم والأكل الحلال في لندن",
    summary:
      "مناطق الطعام الحلال والمطاعم ذات الأولوية للتحقق، مع تنبيه واضح إلى ضرورة مراجعة حالة الحلال في يوم النشر.",
  },
  "health-and-safety": {
    title: "الصحة والسلامة",
    summary:
      "إرشادات مختصرة للطوارئ والخدمات الصحية والصيدليات والسلامة اليومية في لندن.",
  },
  hotels: {
    title: "فنادق لندن",
    summary:
      "ترشيحات فندقية قائمة على الموقع والملاءمة العملية للمسافر المسلم، من الفخامة الكلاسيكية إلى الشقق الفندقية.",
  },
  "muslim-visitor-information": {
    title: "معلومات الزائر المسلم: المساجد ومرافق الصلاة",
    summary:
      "أبرز المساجد ومرافق الصلاة في لندن، مع قواعد تحقق خاصة بمواقيت الصلاة والوضوء ومرافق النساء وإتاحة الزيارة.",
  },
  "neighborhood-operating-guide": {
    title: "دليل أحياء لندن التشغيلي",
    summary:
      "طبقات بحث حيّة على مستوى أحياء لندن وبلدياتها لاكتشاف المطاعم الحلال والمساجد ومرافق الصلاة القريبة.",
  },
  "organized-tours": {
    title: "الجولات والمسارات المنظمة",
    summary:
      "جولات ومسارات تقلل مشقة التنقل وتضيف سياقاً ثقافياً وتاريخياً مناسباً للعائلات والمسافرين المسلمين.",
  },
  "places-to-visit": {
    title: "أماكن تستحق الزيارة في لندن",
    summary:
      "معالم لندن الملكية والمتاحف والحدائق ونقاط المشاهدة والأحياء التراثية، مرتبة بما يخدم التخطيط العملي للزيارة.",
  },
  shopping: {
    title: "التسوق في لندن",
    summary:
      "من المتاجر الفاخرة والأسواق التاريخية إلى شوارع التسوق ذات الصلة بالزوار المسلمين ومناطق الأزياء المحتشمة.",
  },
  "transportation-and-getting-around": {
    title: "المواصلات والتنقل في لندن",
    summary:
      "إرشادات عملية لاستخدام المترو وخط إليزابيث والحافلات والقطارات وسيارات الأجرة والمطارات.",
  },
  "visitor-information": {
    title: "معلومات الزائر",
    summary:
      "معلومات التأشيرة وتصريح السفر الإلكتروني والطقس والعطلات والحقائق الأساسية التي يحتاجها زائر لندن.",
  },
};

const lexicalFromParagraphs = (paragraphs: string[] = []) => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children: paragraphs
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            version: 1,
          },
        ],
      })),
  },
});

const deleteChildRows = async (
  client: DbClient,
  tableName: string,
  parentId: number | string,
) => {
  await client.query(`delete from payload.${tableName} where _parent_id = $1`, [
    parentId,
  ]);
};

const getExistingId = async (
  client: DbClient,
  query: string,
  values: unknown[],
) => {
  const result = await client.query(query, values);
  return result.rows[0]?.id as number | undefined;
};

const insertSource = async (
  client: DbClient,
  tableName: string,
  parentId: number | string,
  order = 0,
  confidence?: string,
) => {
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

const upsertCountry = async (client: DbClient) => {
  const existingId = await getExistingId(
    client,
    "select id from payload.countries where slug = $1 limit 1",
    ["united-kingdom"],
  );
  const values = [
    "United Kingdom",
    "united-kingdom",
    "GB",
    "GBR",
    "Europe",
    "Northern Europe",
    "London",
    "GBP",
    "United Kingdom country record for Irhal city guides, beginning with the London enterprise guide model.",
    "GB",
    "published",
    "United Kingdom Travel Guides | Irhal AI Travel",
    "Structured Irhal travel guides for cities in the United Kingdom.",
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

  for (const [index, language] of ["English", "Welsh"].entries()) {
    await client.query(
      "insert into payload.countries_languages (_order, _parent_id, id, language) values ($1, $2, $3, $4)",
      [index, countryId, randomUUID(), language],
    );
  }
  await client.query(
    "insert into payload.countries_calling_codes (_order, _parent_id, id, code) values (0, $1, $2, '+44')",
    [countryId, randomUUID()],
  );
  await insertSource(client, "countries", countryId);

  return countryId;
};

const structuredGuide = () => ({
  source: data.source,
  city: {
    country: data.city.country,
    name: data.city.name,
    region: data.city.region,
    slug: data.city.slug,
    updatedLabel: data.city.updatedLabel,
  },
  introBlocks: data.sections[0]?.blocks ?? [],
  sections: data.sections.map((section) => ({
    blocks: section.blocks,
    slug: section.slug,
    summary: section.summary,
    title: section.title,
  })),
  tables: data.tables,
  coverage: data.coverage,
});

const upsertCity = async (client: DbClient, countryId: number) => {
  const existingId = await getExistingId(
    client,
    "select id from payload.cities where slug = $1 limit 1",
    ["london"],
  );
  const translations = {
    ar: {
      title: "لندن",
      name: "لندن",
      summary:
        "لندن عاصمة عالمية تجمع بين الملكية والمتاحف والمسرح والمال والحدائق والهجرة والإيمان، وهي من أقوى وجهات المدن الأوروبية للمسافرين المسلمين.",
      description:
        "دليل لندن من إرحل يربط المعالم الكلاسيكية بالمطاعم الحلال والمساجد والأحياء المناسبة للعائلات، مع توثيق وتحديث تحريري مستمر.",
    },
  };
  const fastFacts = data.fastFacts.length
    ? data.fastFacts
    : [
        { label: "Country", value: "United Kingdom" },
        { label: "Region", value: "Greater London, England" },
        { label: "Currency", value: "Pound sterling (GBP)" },
      ];

  const values = [
    "London",
    "london",
    countryId,
    "Greater London, England",
    "en",
    data.city.lede,
    "Europe/London",
    "GBP",
    51.5072,
    -0.1276,
    "https://www.google.com/maps/search/?api=1&query=London%2C+United+Kingdom",
    JSON.stringify(structuredGuide()),
    translations,
    "published",
    "London Travel Guide for Muslim Travellers | Irhal",
    "Explore London with Irhal: places to visit, hotels, halal restaurants, shopping, tours, family ideas, masjids, prayer spaces, and Muslim-friendly itineraries.",
    "/city/london",
    "index,follow",
    "City",
    source.verifiedAt,
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
          translations = $13::jsonb,
          workflow_status = $14,
          seo_title = $15,
          seo_description = $16,
          seo_canonical_url = $17,
          seo_robots = $18,
          seo_schema_type = $19,
          last_verified_at = $20,
          _status = 'published',
          updated_at = now()
        where id = $21
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
          translations,
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
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9::double precision, $10::double precision, ${pointSql.replace("$LONGITUDE$", "$10").replace("$LATITUDE$", "$9")}, $11, $12::jsonb, $13::jsonb, $14, $15, $16, $17, $18, $19, $20, 'published', now(), now())
        returning id`,
        values,
      );

  const cityId = result.rows[0]?.id as number;
  await Promise.all([
    deleteChildRows(client, "cities_languages", cityId),
    deleteChildRows(client, "cities_fast_facts", cityId),
    deleteChildRows(client, "cities_sources", cityId),
  ]);

  for (const [index, language] of ["English", "Arabic"].entries()) {
    await client.query(
      "insert into payload.cities_languages (_order, _parent_id, id, language) values ($1, $2, $3, $4)",
      [index, cityId, randomUUID(), language],
    );
  }
  for (const [index, fact] of fastFacts.entries()) {
    await client.query(
      "insert into payload.cities_fast_facts (_order, _parent_id, id, label, value) values ($1, $2, $3, $4, $5)",
      [index, cityId, randomUUID(), fact.label, fact.value],
    );
  }
  await insertSource(client, "cities", cityId);

  return cityId;
};

const boroughZone = (borough: string) => {
  const east = new Set([
    "Barking and Dagenham",
    "Bexley",
    "Greenwich",
    "Hackney",
    "Havering",
    "Newham",
    "Redbridge",
    "Tower Hamlets",
    "Waltham Forest",
  ]);
  const north = new Set(["Barnet", "Camden", "Enfield", "Haringey", "Islington"]);
  const south = new Set([
    "Bromley",
    "Croydon",
    "Kingston upon Thames",
    "Lambeth",
    "Lewisham",
    "Merton",
    "Richmond upon Thames",
    "Southwark",
    "Sutton",
    "Wandsworth",
  ]);
  const west = new Set([
    "Brent",
    "Ealing",
    "Hammersmith and Fulham",
    "Harrow",
    "Hillingdon",
    "Hounslow",
    "Kensington and Chelsea",
  ]);
  if (east.has(borough)) return "east";
  if (north.has(borough)) return "north";
  if (south.has(borough)) return "south";
  if (west.has(borough)) return "west";
  return "central";
};

const zoneCoordinates: Record<string, { latitude: number; longitude: number }> = {
  central: { latitude: 51.5072, longitude: -0.1276 },
  east: { latitude: 51.5389, longitude: 0.0129 },
  north: { latitude: 51.5906, longitude: -0.143 },
  south: { latitude: 51.4452, longitude: -0.0702 },
  west: { latitude: 51.5074, longitude: -0.3064 },
};

const boroughRows = () => {
  const table = data.tables.find((item) => item.purpose === "borough_live_discovery");
  return (table?.rows ?? []).map((row) => {
    const borough = row.values.borough;
    const zone = boroughZone(borough);
    return {
      borough,
      halalMapUrl:
        row.links.halal_restaurants_live_map?.[0]?.url ||
        `https://www.google.com/maps/search/?api=1&query=halal+restaurants+${encodeURIComponent(borough)}%2C+London%2C+United+Kingdom`,
      masjidMapUrl:
        row.links.masjids_and_prayer_rooms_live_map?.[0]?.url ||
        `https://www.google.com/maps/search/?api=1&query=mosques+${encodeURIComponent(borough)}%2C+London%2C+United+Kingdom`,
      zone,
      ...zoneCoordinates[zone],
    };
  });
};

const replaceCityChildrenBulk = async (client: DbClient, cityId: number) => {
  const sourceParams = sourceValues();
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
    "delete from payload.neighborhoods_best_for where _parent_id in (select id from payload.neighborhoods where city_id = $1)",
    "delete from payload.neighborhoods_sources where _parent_id in (select id from payload.neighborhoods where city_id = $1)",
    "delete from payload.neighborhoods where city_id = $1",
    "delete from payload.districts_sources where _parent_id in (select id from payload.districts where city_id = $1)",
    "delete from payload.districts where city_id = $1",
  ];

  for (const statement of deleteStatements) {
    await client.query(statement, [cityId]);
  }

  await client.query(
    "create temporary table seed_districts (slug text primary key, id integer) on commit drop",
  );
  await client.query(
    "create temporary table seed_neighborhoods (slug text primary key, id integer) on commit drop",
  );
  await client.query(
    "create temporary table seed_sections (section_slug text primary key, id integer) on commit drop",
  );
  await client.query(
    "create temporary table seed_itineraries (slug text primary key, id integer, days jsonb) on commit drop",
  );

  const districtRows = Object.entries(zoneCoordinates).map(([zone, coords]) => ({
    city_id: cityId,
    latitude: coords.latitude,
    longitude: coords.longitude,
    map_url: `https://www.google.com/maps/search/?api=1&query=${zone}+London%2C+United+Kingdom`,
    name: `${zone[0]?.toUpperCase()}${zone.slice(1)} London`,
    slug: `${zone}-london`,
    summary: `${zone[0]?.toUpperCase()}${zone.slice(1)} London borough cluster for the London enterprise city guide.`,
    zone,
  }));
  const neighborhoods = boroughRows().map((row) => ({
    best_for: ["Halal dining discovery", "Masjid and prayer-room discovery"],
    city_id: cityId,
    cluster_type: row.zone === "central" ? "business" : "mixed",
    district_slug: `${row.zone}-london`,
    image_alt: `${row.borough}, London`,
    latitude: row.latitude,
    live_map_queries: [
      {
        label: "Halal restaurants",
        providerUrl: row.halalMapUrl,
        query: `halal restaurants ${row.borough}, London, United Kingdom`,
      },
      {
        label: "Masjids and prayer rooms",
        providerUrl: row.masjidMapUrl,
        query: `mosques and prayer rooms ${row.borough}, London, United Kingdom`,
      },
    ],
    longitude: row.longitude,
    map_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.borough)}%2C+London%2C+United+Kingdom`,
    name: row.borough,
    operating_guide: `${row.borough} is included as a London borough live-discovery layer for halal restaurants, masjids and prayer rooms. Use the map links for current branch-level discovery, then verify venue status before publication.`,
    seo_description: `Halal dining, masjid and prayer-room discovery layer for ${row.borough}, London.`,
    seo_title: `${row.borough} London Muslim Travel Guide`,
    slug: row.borough.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
    translations: {},
  }));
  const sectionRows = data.sections.map((section) => ({
    city_id: cityId,
    section_slug: section.slug,
    section_type: section.sectionType,
    seo_description: section.summary,
    seo_title: `${section.title} | London`,
    source_import: {
      articles: section.articles,
      sourceFile: data.source.fileName,
    },
    summary: section.summary,
    title: section.title,
    translations: arabicSections[section.slug]
      ? { ar: arabicSections[section.slug] }
      : {},
  }));
  const guideItemRows = data.guideItems.map((item) => ({
    area: item.area,
    body: lexicalFromParagraphs(item.originalContent),
    budget: null,
    category: item.category,
    city_id: cityId,
    geo_status: item.geoStatus,
    image_alt: item.imageAlt,
    imported_details: item.details,
    kind: item.kind,
    map_url: item.mapUrl || null,
    section_slug: item.sectionSlug,
    seo_description: item.description,
    seo_schema_type:
      item.kind === "restaurant"
        ? "Restaurant"
        : item.kind === "hotel"
          ? "Hotel"
          : item.kind === "festival"
            ? "Event"
            : "Place",
    seo_title: `${item.title} | London`,
    slug: item.slug,
    source_row_id: item.sourceRowId,
    source_table: item.sourceTable,
    summary: item.description,
    title: item.title,
  }));
  const itineraryRows = data.itineraries.map((itinerary) => {
    const enrichment = londonItineraryDetailsBySlug[itinerary.slug];
    const enrichedDaysByNumber = new Map(
      (enrichment?.days ?? []).map((day) => [day.dayNumber, day]),
    );

    return {
      audience: itinerary.audience,
      city_id: cityId,
      days: itinerary.days.map((day) => ({
        ...(enrichedDaysByNumber.get(day.dayNumber) ?? {}),
        ...day,
        routeNotes:
          enrichedDaysByNumber.get(day.dayNumber)?.routeNotes ?? day.routeNotes,
        stops:
          day.stops.length > 0
            ? day.stops
            : (londonItineraryStopSlugs[itinerary.slug] ?? []),
      })),
      duration_days: itinerary.durationDays,
      intro: enrichment?.intro ?? itinerary.intro ?? null,
      planning_meals_breakfast:
        enrichment?.planning.meals?.breakfast ??
        itinerary.planning?.meals?.breakfast ??
        null,
      planning_meals_dinner:
        enrichment?.planning.meals?.dinner ??
        itinerary.planning?.meals?.dinner ??
        null,
      planning_meals_lunch:
        enrichment?.planning.meals?.lunch ??
        itinerary.planning?.meals?.lunch ??
        null,
      planning_stay:
        enrichment?.planning.stay ?? itinerary.planning?.stay ?? null,
      planning_transport:
        enrichment?.planning.transport ?? itinerary.planning?.transport ?? null,
      seo_description: itinerary.summary,
      seo_title: `${itinerary.title} | London`,
      slug: itinerary.slug,
      summary: itinerary.summary,
      title: itinerary.title,
      translations: {},
    };
  });

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         city_id integer,
         latitude double precision,
         longitude double precision,
         map_url text,
         name text,
         slug text,
         summary text,
         zone text
       )
     ),
     inserted as (
       insert into payload.districts (
         name, slug, city_id, zone, summary, latitude, longitude, geo, map_url,
         workflow_status, updated_at, created_at
       )
       select
         name, slug, city_id, zone::payload.enum_districts_zone, summary,
         latitude, longitude,
         extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326),
         map_url, 'published', now(), now()
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
         best_for jsonb,
         city_id integer,
         cluster_type text,
         district_slug text,
         image_alt text,
         latitude double precision,
         live_map_queries jsonb,
         longitude double precision,
         map_url text,
         name text,
         operating_guide text,
         seo_description text,
         seo_title text,
         slug text,
         translations jsonb
       )
     ),
     inserted as (
       insert into payload.neighborhoods (
         name, slug, city_id, district_id, cluster_type, operating_guide,
         image_alt, latitude, longitude, geo, map_url, live_map_queries,
         translations, workflow_status, seo_title, seo_description, seo_robots,
         seo_schema_type, updated_at, created_at
       )
       select
         rows.name, rows.slug, rows.city_id, seed_districts.id,
         rows.cluster_type::payload.enum_neighborhoods_cluster_type,
         rows.operating_guide, rows.image_alt, rows.latitude, rows.longitude,
         extensions.ST_SetSRID(extensions.ST_MakePoint(rows.longitude, rows.latitude), 4326),
         rows.map_url, rows.live_map_queries, rows.translations, 'published',
         rows.seo_title, rows.seo_description, 'index,follow', 'Place', now(), now()
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
    [JSON.stringify(neighborhoods), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         city_id integer,
         section_slug text,
         section_type text,
         seo_description text,
         seo_title text,
         source_import jsonb,
         summary text,
         title text,
         translations jsonb
       )
     ),
     inserted as (
       insert into payload.guide_sections (
         title, section_slug, city_id, section_type, summary, body,
         source_import, translations, workflow_status, seo_title,
         seo_description, seo_robots, seo_schema_type, updated_at, created_at
       )
       select
         title, section_slug, city_id,
         section_type::payload.enum_guide_sections_section_type,
         summary, null, source_import, translations, 'published',
         seo_title, seo_description, 'index,follow', 'Article', now(), now()
       from rows
       returning id, section_slug
     ),
     source_rows as (
       insert into payload.guide_sections_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
       select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_guide_sections_sources_type, $5::timestamptz, $6::payload.enum_guide_sections_sources_confidence
       from inserted
     )
     insert into seed_sections (section_slug, id)
     select section_slug, id from inserted`,
    [JSON.stringify(sectionRows), ...sourceParams],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         area text,
         body jsonb,
         budget text,
         category text,
         city_id integer,
         geo_status text,
         image_alt text,
         imported_details jsonb,
         kind text,
         map_url text,
         section_slug text,
         seo_description text,
         seo_schema_type text,
         seo_title text,
         slug text,
         source_row_id text,
         source_table text,
         summary text,
         title text
       )
     ),
     inserted as (
       insert into payload.guide_items (
         title, slug, kind, city_id, section_id, section_slug, summary, body,
         image_alt, area, category, budget, map_url, geo_status,
         imported_details, source_table, source_row_id, workflow_status,
         seo_title, seo_description, seo_robots, seo_schema_type, _status,
         updated_at, created_at
       )
       select
         rows.title, rows.slug, rows.kind::payload.enum_guide_items_kind,
         rows.city_id, seed_sections.id, rows.section_slug, rows.summary,
         rows.body, rows.image_alt, rows.area, rows.category, rows.budget,
         rows.map_url, rows.geo_status::payload.enum_guide_items_geo_status,
         rows.imported_details, rows.source_table, rows.source_row_id,
         'published', rows.seo_title, rows.seo_description, 'index,follow',
         rows.seo_schema_type, 'published', now(), now()
       from rows
       left join seed_sections on seed_sections.section_slug = rows.section_slug
       returning id
     )
     insert into payload.guide_items_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
     select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_guide_items_sources_type, $5::timestamptz, 'medium'::payload.enum_guide_items_sources_confidence
     from inserted`,
    [JSON.stringify(guideItemRows), source.label, source.url, source.type, source.verifiedAt],
  );

  await client.query(
    `insert into payload._guide_items_v (
       parent_id, version_title, version_slug, version_kind, version_city_id,
       version_section_id, version_section_slug, version_summary, version_body,
       version_image_id, version_neighborhood_id, version_image_alt,
       version_area, version_category, version_budget, version_map_url,
       version_geo_status, version_latitude, version_longitude,
       version_provider_place_id, version_imported_details,
       version_source_table, version_source_row_id, version_workflow_status,
       version_seo_title, version_seo_description, version_seo_canonical_url,
       version_seo_open_graph_image_id, version_seo_robots,
       version_seo_schema_type, version_updated_at, version_created_at,
       version__status, created_at, updated_at, snapshot, published_locale,
       latest, version_translations
     )
     select
       guide_items.id, guide_items.title, guide_items.slug,
       guide_items.kind::text::payload.enum__guide_items_v_version_kind,
       guide_items.city_id, guide_items.section_id, guide_items.section_slug,
       guide_items.summary, guide_items.body, guide_items.image_id,
       guide_items.neighborhood_id, guide_items.image_alt, guide_items.area,
       guide_items.category, guide_items.budget, guide_items.map_url,
       guide_items.geo_status::text::payload.enum__guide_items_v_version_geo_status,
       guide_items.latitude, guide_items.longitude, guide_items.provider_place_id,
       guide_items.imported_details, guide_items.source_table,
       guide_items.source_row_id,
       guide_items.workflow_status::text::payload.enum__guide_items_v_version_workflow_status,
       guide_items.seo_title, guide_items.seo_description,
       guide_items.seo_canonical_url, guide_items.seo_open_graph_image_id,
       guide_items.seo_robots::text::payload.enum__guide_items_v_version_seo_robots,
       guide_items.seo_schema_type, guide_items.updated_at,
       guide_items.created_at,
       guide_items._status::text::payload.enum__guide_items_v_version_status,
       now(), now(), null, null, true, guide_items.translations
     from payload.guide_items
     where guide_items.city_id = $1
       and not exists (
         select 1 from payload._guide_items_v versions
         where versions.parent_id = guide_items.id and versions.latest is true
       )`,
    [cityId],
  );

  await client.query(
    `with rows as (
       select * from jsonb_to_recordset($1::jsonb) as row_data (
         audience text,
         city_id integer,
         days jsonb,
         duration_days integer,
         intro text,
         planning_meals_breakfast text,
         planning_meals_dinner text,
         planning_meals_lunch text,
         planning_stay text,
         planning_transport text,
         seo_description text,
         seo_title text,
         slug text,
         summary text,
         title text,
         translations jsonb
       )
     ),
     inserted as (
       insert into payload.itineraries (
         title, slug, city_id, duration_days, audience, summary, intro,
         planning_stay, planning_transport, planning_meals_breakfast,
         planning_meals_lunch, planning_meals_dinner, translations,
         workflow_status, seo_title, seo_description, seo_robots,
         seo_schema_type, updated_at, created_at
       )
       select
         title, slug, city_id, duration_days,
         audience::payload.enum_itineraries_audience, summary, intro,
         planning_stay, planning_transport, planning_meals_breakfast,
         planning_meals_lunch, planning_meals_dinner, translations,
         'published', seo_title, seo_description, 'index,follow',
         'TravelAction', now(), now()
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
       insert into payload.itineraries_days (
         _order, _parent_id, id, day_number, theme, description, start,
         transport, breakfast, lunch, dinner, pacing, stop_slugs, route_notes
       )
       select
         (day_item.ordinality - 1)::integer, itinerary_map.id,
         gen_random_uuid()::text, (day_item.day ->> 'dayNumber')::numeric,
         day_item.day ->> 'theme',
         day_item.day ->> 'description',
         day_item.day ->> 'start',
         day_item.day ->> 'transport',
         day_item.day ->> 'breakfast',
         day_item.day ->> 'lunch',
         day_item.day ->> 'dinner',
         day_item.day ->> 'pacing',
         array_to_string(
           array(
             select jsonb_array_elements_text(day_item.day -> 'stops')
           ),
           E'\n'
         ),
         day_item.day ->> 'routeNotes'
       from itinerary_map
       cross join lateral jsonb_array_elements(itinerary_map.days) with ordinality as day_item(day, ordinality)
     )
     insert into payload.itineraries_sources (_order, _parent_id, id, label, url, type, verified_at, confidence)
     select 0, id, gen_random_uuid()::text, $2, $3, $4::payload.enum_itineraries_sources_type, $5::timestamptz, $6::payload.enum_itineraries_sources_confidence
     from seed_itineraries`,
    [JSON.stringify(itineraryRows), ...sourceParams],
  );

  return {
    districtCount: districtRows.length,
    guideItemCount: guideItemRows.length,
    itineraryCount: itineraryRows.length,
    neighborhoodCount: neighborhoods.length,
    sectionCount: sectionRows.length,
  };
};

const validateSeed = async (client: DbClient) => {
  const cityId = await getExistingId(
    client,
    "select id from payload.cities where slug = $1 limit 1",
    ["london"],
  );
  if (!cityId) throw new Error("London city was not created.");

  const expected = {
    districts: 5,
    guide_items: data.guideItems.length,
    guide_sections: data.sections.length,
    itineraries: data.itineraries.length,
    neighborhoods: boroughRows().length,
  };
  const actual: Record<string, number> = {};
  for (const tableName of Object.keys(expected)) {
    const result = await client.query(
      `select count(*)::int as count from payload.${tableName} where city_id = $1`,
      [cityId],
    );
    actual[tableName] = result.rows[0]?.count as number;
  }

  const mismatches = Object.entries(expected).filter(
    ([tableName, count]) => actual[tableName] !== count,
  );
  if (mismatches.length > 0) {
    throw new Error(`London seed validation failed: ${JSON.stringify({ expected, actual })}`);
  }

  return { actual, cityId };
};

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await assertSafeCityBaselineSeed({
    allowDestructiveSeed,
    cityLabel: "London",
    citySlug: "london",
    client,
    resetCommand:
      "IRHAL_ALLOW_DESTRUCTIVE_SEED=true npx tsx scripts/seed-london-guide.ts",
  });
  await client.query("begin");

  const countryId = await upsertCountry(client);
  const cityId = await upsertCity(client, countryId);
  const seedCounts = await replaceCityChildrenBulk(client, cityId);

  await client.query("commit");

  const validation = await validateSeed(client);
  console.log(
    `Seeded London into Payload: country ${countryId}, city ${cityId}, ${seedCounts.sectionCount} sections, ${seedCounts.guideItemCount} guide items, ${seedCounts.itineraryCount} itineraries, ${seedCounts.neighborhoodCount} neighborhoods, and ${seedCounts.districtCount} districts.`,
  );
  console.log(`London validation: ${JSON.stringify(validation)}`);
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
