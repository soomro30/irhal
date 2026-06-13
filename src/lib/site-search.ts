import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import { Pool } from "pg";

import config from "@/payload.config";
import { getCityHeroImage, getGuideItemImage } from "@/lib/city-presentation";
import type { CityGuide } from "@/lib/city-data";
import { getCityBySlug, getCityNavItems } from "@/lib/city-source";
import {
  getGuideArticlesForSection,
  getGuideItems,
  kindSingular,
  localizeGuideArticle,
  localizeGuideItem,
  pathForGuideItem,
  sectionCards,
} from "@/lib/guide-items";

export type SearchLocale = "en" | "ar";

export type SiteSearchResult = {
  id: string;
  title: string;
  subtitle: string;
  type:
    | "article"
    | "city"
    | "family"
    | "festival"
    | "hotel"
    | "masjid"
    | "neighborhood"
    | "place"
    | "restaurant"
    | "section"
    | "shopping"
    | "tour"
    | "itinerary";
  href: string;
  image?: string;
  city?: string;
  description?: string;
  label: string;
  score: number;
};

type SearchDocument = SiteSearchResult & {
  body: string;
  priority: number;
};

type GuideItemResultType = Extract<
  SiteSearchResult["type"],
  | "family"
  | "festival"
  | "hotel"
  | "masjid"
  | "place"
  | "restaurant"
  | "shopping"
  | "tour"
>;

type CMSDoc = Record<string, unknown> & {
  id?: number | string;
};

type IndexedSearchRow = CMSDoc & {
  doc?: {
    relationTo?: string;
    value?: number | string | CMSDoc;
  };
  priority?: number | null;
  title?: string | null;
};

type SqlSearchRow = {
  body: string | null;
  city_name: string | null;
  city_slug: string | null;
  country: string | null;
  href_path: string | null;
  id: string;
  image: string | null;
  label_key: string | null;
  priority: number | string | null;
  subtitle: string | null;
  title: string | null;
  type: SiteSearchResult["type"];
};

declare global {
  var __irhalSearchPool: Pool | undefined;
}

const guideItemResultTypes = new Set<GuideItemResultType>([
  "family",
  "festival",
  "hotel",
  "masjid",
  "place",
  "restaurant",
  "shopping",
  "tour",
]);

const isGuideItemResultType = (value: string): value is GuideItemResultType =>
  guideItemResultTypes.has(value as GuideItemResultType);

const toPublicResult = (document: SearchDocument): SiteSearchResult => ({
  city: document.city,
  description: document.description,
  href: document.href,
  id: document.id,
  image: document.image,
  label: document.label,
  score: document.score,
  subtitle: document.subtitle,
  title: document.title,
  type: document.type,
});

const searchCache = new Map<
  SearchLocale,
  { expiresAt: number; documents: SearchDocument[] }
>();

const searchCacheTtlMs = 60_000;
const searchIndexRevalidateSeconds = 60 * 60;

const isCMSConfigured = () =>
  Boolean(
    process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("<") &&
      process.env.PAYLOAD_SECRET,
  );

const asRecord = (value: unknown): CMSDoc =>
  value && typeof value === "object" ? (value as CMSDoc) : {};

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

const relationshipDoc = (value: unknown): CMSDoc | undefined => {
  const doc = asRecord(value);
  return Object.keys(doc).length > 0 ? doc : undefined;
};

const relationshipName = (value: unknown, fallback = "") => {
  if (typeof value === "string") return value;
  return asString(asRecord(value).name, fallback);
};

const relationshipId = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") return value;
  const doc = asRecord(value);
  return doc.id as number | string | undefined;
};

const localizedField = (
  doc: CMSDoc,
  locale: SearchLocale,
  field: string,
  fallback = "",
) => {
  if (locale !== "ar") return asString(doc[field], fallback);
  const ar = asRecord(asRecord(doc.translations).ar);
  return asString(ar[field]) || asString(doc[`arabic${field[0]?.toUpperCase()}${field.slice(1)}`]) || asString(doc[field], fallback);
};

const mediaUrl = (value: unknown, preferredSizes: string[] = ["card", "hero"]) => {
  const media = asRecord(value);
  const sizes = asRecord(media.sizes);

  for (const sizeName of preferredSizes) {
    const size = asRecord(sizes[sizeName]);
    const url = asString(size.url);
    if (url) return url;
  }

  return asString(media.url);
};

const citySummaryFromRelationship = (
  value: unknown,
  locale: SearchLocale,
): { country: string; image?: string; name: string; slug: string } | undefined => {
  const city = relationshipDoc(value);
  if (!city) return undefined;
  const slug = asString(city.slug);
  if (!slug) return undefined;

  return {
    country: localizedCountry(relationshipName(city.country), slug, locale),
    image: mediaUrl(city.heroImage, ["card", "hero"]) || undefined,
    name: localizedCityName({ name: asString(city.name), slug }, locale),
    slug,
  };
};

const getSearchPool = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString || connectionString.includes("<")) return undefined;

  globalThis.__irhalSearchPool ??= new Pool({
    connectionString,
    max: 3,
    ssl: connectionString
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
  });

  return globalThis.__irhalSearchPool;
};

const sqlMediaUrl = "coalesce(m.sizes_card_url, m.sizes_hero_url, m.url)";

const getSqlSearchDocuments = unstable_cache(
  async (
    locale: SearchLocale,
    normalizedQuery: string,
    requestedLimit: number,
  ): Promise<SearchDocument[]> => {
    const pool = getSearchPool();
    if (!pool || normalizedQuery.length < 2) return [];

    const labels = resultLabels(locale);
    const prefix = locale === "ar" ? "/ar" : "/en";
    const likeQuery = `%${normalizedQuery}%`;
    const queryLimit = Math.min(Math.max(requestedLimit * 5, 30), 80);

    const result = await pool.query<SqlSearchRow>(
      `
        with matches as (
          select
            concat('city:', c.slug) as id,
            case when $3 = 'ar' and c.slug = 'karachi' then 'كراتشي' else c.name end as title,
            case when $3 = 'ar' and c.slug = 'karachi' then 'باكستان' else coalesce(country.name, '') end as subtitle,
            'city'::text as type,
            concat('/city/', c.slug) as href_path,
            ${sqlMediaUrl} as image,
            case when $3 = 'ar' and c.slug = 'karachi' then 'كراتشي' else c.name end as city_name,
            c.slug as city_slug,
            coalesce(country.name, '') as country,
            'city'::text as label_key,
            120::numeric as priority,
            c.lede as body
          from payload.cities c
          left join payload.countries country on country.id = c.country_id
          left join payload.media m on m.id = c.hero_image_id and m.usage_status = 'approved'
          where c._status = 'published'
            and (c.name ilike $1 or c.slug ilike $1 or country.name ilike $1)

          union all

          select
            concat('item:', city.slug, ':', gi.kind::text, ':', gi.slug) as id,
            case when $3 = 'ar' then coalesce(gi.arabic_title, gi.title) else gi.title end as title,
            concat(
              gi.kind::text,
              case
                when coalesce(case when $3 = 'ar' then gi.arabic_area else gi.area end, '') <> ''
                  then concat(' · ', case when $3 = 'ar' then gi.arabic_area else gi.area end)
                else concat(' · ', case when $3 = 'ar' and city.slug = 'karachi' then 'كراتشي' else city.name end)
              end
            ) as subtitle,
            gi.kind::text as type,
            concat('/city/', city.slug, '/', gi.kind::text, '/', gi.slug) as href_path,
            coalesce(${sqlMediaUrl}, city_media.sizes_card_url, city_media.sizes_hero_url, city_media.url) as image,
            case when $3 = 'ar' and city.slug = 'karachi' then 'كراتشي' else city.name end as city_name,
            city.slug as city_slug,
            null::text as country,
            gi.kind::text as label_key,
            case when gi.kind::text = 'place' then 84 else 78 end::numeric as priority,
            concat_ws(' ', gi.summary, gi.category, gi.area, gi.address) as body
          from payload.guide_items gi
          join payload.cities city on city.id = gi.city_id
          left join payload.media m on m.id = gi.image_id and m.usage_status = 'approved'
          left join payload.media city_media on city_media.id = city.hero_image_id and city_media.usage_status = 'approved'
          where gi._status = 'published'
            and (
              gi.title ilike $1
              or gi.slug ilike $1
              or gi.summary ilike $1
              or gi.area ilike $1
              or gi.category ilike $1
              or gi.arabic_title ilike $1
              or gi.arabic_summary ilike $1
            )

          union all

          select
            concat('neighborhood:', city.slug, ':', n.slug) as id,
            coalesce(n.name, '') as title,
            case when $3 = 'ar' then concat('منطقة في ', case when city.slug = 'karachi' then 'كراتشي' else city.name end) else concat('Area in ', city.name) end as subtitle,
            'neighborhood'::text as type,
            concat('/city/', city.slug, '/neighborhood/', n.slug) as href_path,
            coalesce(${sqlMediaUrl}, city_media.sizes_card_url, city_media.sizes_hero_url, city_media.url) as image,
            case when $3 = 'ar' and city.slug = 'karachi' then 'كراتشي' else city.name end as city_name,
            city.slug as city_slug,
            null::text as country,
            'neighborhood'::text as label_key,
            76::numeric as priority,
            n.operating_guide as body
          from payload.neighborhoods n
          join payload.cities city on city.id = n.city_id
          left join payload.media m on m.id = n.image_id and m.usage_status = 'approved'
          left join payload.media city_media on city_media.id = city.hero_image_id and city_media.usage_status = 'approved'
          where n.workflow_status = 'published'
            and (n.name ilike $1 or n.slug ilike $1 or n.operating_guide ilike $1)

          union all

          select
            concat('section:', city.slug, ':', gs.section_slug) as id,
            gs.title as title,
            case when $3 = 'ar' then concat('قسم في ', case when city.slug = 'karachi' then 'كراتشي' else city.name end) else concat('Guide section in ', city.name) end as subtitle,
            'section'::text as type,
            concat('/city/', city.slug, '/section/', gs.section_slug) as href_path,
            coalesce(city_media.sizes_card_url, city_media.sizes_hero_url, city_media.url) as image,
            case when $3 = 'ar' and city.slug = 'karachi' then 'كراتشي' else city.name end as city_name,
            city.slug as city_slug,
            null::text as country,
            'section'::text as label_key,
            70::numeric as priority,
            gs.summary as body
          from payload.guide_sections gs
          join payload.cities city on city.id = gs.city_id
          left join payload.media city_media on city_media.id = city.hero_image_id and city_media.usage_status = 'approved'
          where gs.workflow_status = 'published'
            and (gs.title ilike $1 or gs.section_slug ilike $1 or gs.summary ilike $1)

          union all

          select
            concat('itinerary:', city.slug, ':', it.slug) as id,
            it.title as title,
            case when $3 = 'ar' then concat('مسار في ', case when city.slug = 'karachi' then 'كراتشي' else city.name end) else concat('Itinerary in ', city.name) end as subtitle,
            'itinerary'::text as type,
            concat('/city/', city.slug, '/itineraries/', it.slug) as href_path,
            coalesce(city_media.sizes_card_url, city_media.sizes_hero_url, city_media.url) as image,
            case when $3 = 'ar' and city.slug = 'karachi' then 'كراتشي' else city.name end as city_name,
            city.slug as city_slug,
            null::text as country,
            'itinerary'::text as label_key,
            65::numeric as priority,
            it.summary as body
          from payload.itineraries it
          join payload.cities city on city.id = it.city_id
          left join payload.media city_media on city_media.id = city.hero_image_id and city_media.usage_status = 'approved'
          where it.workflow_status = 'published'
            and (it.title ilike $1 or it.slug ilike $1 or it.summary ilike $1)
        )
        select *
        from matches
        order by priority desc, title asc
        limit $2
      `,
      [likeQuery, queryLimit, locale],
    );

    return result.rows
      .map((row) => {
        const type = row.type;
        const title = row.title ?? "";
        const cityName = row.city_name ?? "";
        const label =
          type === "city"
            ? labels.city
            : type === "section"
              ? labels.section
              : type === "neighborhood"
                ? labels.neighborhood
                : type === "itinerary"
                  ? labels.itinerary
                  : isGuideItemResultType(type)
                    ? kindSingular[type][locale]
                    : type;

        return makeDocument({
          id: row.id,
          title,
          subtitle: row.subtitle ?? cityName,
          type,
          href: `${prefix}${row.href_path ?? ""}`,
          image: row.image ?? undefined,
          city: cityName,
          label,
          priority: asNumber(row.priority, 50),
          body: row.body ?? "",
          description: row.body ?? undefined,
        });
      })
      .filter((document) => document.title && document.href !== prefix);
  },
  ["irhal-sql-search-documents-v1"],
  {
    revalidate: 60 * 5,
    tags: ["irhal-city-search:sql"],
  },
);

const sectionTitleByLocale: Record<SearchLocale, Record<string, string>> = {
  ar: {
    "children-in-tow": "السفر مع الأطفال",
    "city-in-a-day-and-longer-itineraries": "مسارات مقترحة",
    "city-information": "معلومات المدينة",
    "climate-when-to-go": "الطقس وأفضل وقت للزيارة",
    "data-resources-and-update-workflow": "مصادر البيانات",
    "festivals-and-annual-events": "المهرجانات والفعاليات",
    "food-and-restaurants": "المطاعم والطعام",
    "health-and-safety": "الصحة والسلامة",
    hotels: "الفنادق",
    "muslim-visitor-information": "معلومات للمسافر المسلم",
    "neighborhood-operating-guide": "الأحياء والمناطق",
    "organized-tours": "الجولات المنظمة",
    "places-to-visit": "أماكن للزيارة",
    shopping: "التسوق",
    "transportation-and-getting-around": "المواصلات والتنقل",
    "visitor-information": "معلومات الزوار",
  },
  en: {},
};

const queryAliases: Record<string, string[]> = {
  attraction: ["place", "things", "sight", "landmark"],
  attractions: ["place", "things", "sight", "landmark"],
  child: ["family", "kids", "children"],
  children: ["family", "kids"],
  dining: ["restaurant", "food", "halal"],
  food: ["restaurant", "dining", "halal"],
  guide: ["city", "destination"],
  halal: ["restaurant", "food", "muslim"],
  kids: ["family", "children"],
  mosque: ["masjid", "prayer"],
  mosques: ["masjid", "prayer"],
  prayer: ["masjid", "mosque", "timings"],
  shop: ["shopping", "market", "mall"],
  shops: ["shopping", "market", "mall"],
  sight: ["place", "attraction"],
  sights: ["place", "attraction"],
  stay: ["hotel", "hotels"],
};

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const titleEntityKey = (title: string, city?: string) => {
  const cityTokens = new Set(normalize(city ?? "").split(" ").filter(Boolean));
  const titleTokens = normalize(title)
    .split(" ")
    .filter(Boolean)
    .filter((token) => !cityTokens.has(token));

  const tokens = titleTokens.length > 0 ? titleTokens : normalize(title).split(" ").filter(Boolean);
  return tokens.sort().join(" ");
};

const expandQueryTokens = (query: string) => {
  const tokens = normalize(query).split(" ").filter(Boolean);
  const expanded = new Set(tokens);
  for (const token of tokens) {
    for (const alias of queryAliases[token] ?? []) expanded.add(alias);
  }
  return [...expanded];
};

const editDistanceWithin = (a: string, b: string, maxDistance: number) => {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
};

const hasFuzzyTokenMatch = (token: string, normalizedTitle: string) => {
  if (token.length < 4) return false;
  const maxDistance = token.length > 7 ? 2 : 1;
  return normalizedTitle
    .split(" ")
    .some((word) => editDistanceWithin(token, word, maxDistance) <= maxDistance);
};

const localizedCityName = (city: CityGuide | { name: string; slug: string }, locale: SearchLocale) => {
  if (locale === "ar" && city.slug === "karachi") return "كراتشي";
  return city.name;
};

const localizedCountry = (country: string, citySlug: string, locale: SearchLocale) => {
  if (locale === "ar" && citySlug === "karachi" && country === "Pakistan") {
    return "باكستان";
  }
  return country;
};

const resultLabels = (locale: SearchLocale) =>
  locale === "ar"
    ? {
        article: "مقال",
        city: "دليل مدينة",
        itinerary: "مسار",
        neighborhood: "منطقة",
        section: "قسم",
      }
    : {
        article: "Article",
        city: "City guide",
        itinerary: "Itinerary",
        neighborhood: "Area",
        section: "Guide section",
      };

const makeDocument = (
  result: Omit<SiteSearchResult, "score"> & { body?: string; priority: number },
): SearchDocument => ({
  ...result,
  body: result.body ?? "",
  score: 0,
});

const documentScore = (document: SearchDocument, query: string) => {
  const normalizedTitle = normalize(document.title);
  const normalizedSubtitle = normalize(document.subtitle);
  const normalizedBody = normalize(document.body);
  const normalizedCity = normalize(document.city ?? "");
  const haystack = `${normalizedTitle} ${normalizedSubtitle} ${normalizedBody} ${normalizedCity}`;
  const tokens = expandQueryTokens(query);

  if (tokens.length === 0) return document.type === "city" ? document.priority : 0;

  let score = document.priority;

  if (document.type === "city" && normalizedTitle === normalize(query)) score += 260;
  else if (normalizedTitle === normalize(query)) score += 180;
  if (normalizedTitle.startsWith(normalize(query))) score += 120;
  if (normalizedTitle.includes(normalize(query))) score += 90;
  if (normalizedCity === normalize(query)) score += 80;
  if (normalizedSubtitle.includes(normalize(query))) score += 45;

  for (const token of tokens) {
    if (normalizedTitle === token) score += 70;
    else if (normalizedTitle.startsWith(token)) score += 45;
    else if (normalizedTitle.includes(token)) score += 30;
    else if (hasFuzzyTokenMatch(token, normalizedTitle)) score += 22;

    if (normalizedCity.includes(token)) score += 18;
    if (normalizedSubtitle.includes(token)) score += 12;
    if (normalizedBody.includes(token)) score += 6;
    if (!haystack.includes(token)) score -= 30;
  }

  return score;
};

const removeDuplicateEntities = (documents: SearchDocument[]) => {
  const guideItemEntityKeys = new Set(
    documents
      .filter((document) => isGuideItemResultType(document.type))
      .map((document) => `${document.city ?? ""}:${titleEntityKey(document.title, document.city)}`),
  );
  const seenEntityKeys = new Set<string>();

  return documents.filter((document) => {
    if (document.type !== "article" && !isGuideItemResultType(document.type)) {
      return true;
    }

    const key = `${document.city ?? ""}:${titleEntityKey(document.title, document.city)}`;
    if (document.type === "article" && guideItemEntityKeys.has(key)) return false;
    if (seenEntityKeys.has(key)) return false;

    seenEntityKeys.add(key);
    return true;
  });
};

const hydrateIndexedRows = async (rows: IndexedSearchRow[]) => {
  const idsByCollection = new Map<string, Array<number | string>>();

  for (const row of rows) {
    const collection = row.doc?.relationTo;
    const id = relationshipId(row.doc?.value);
    if (!collection || id == null) continue;
    idsByCollection.set(collection, [...(idsByCollection.get(collection) ?? []), id]);
  }

  const payload = await getPayload({ config });
  const docsByCollection = new Map<string, Map<number | string, CMSDoc>>();

  await Promise.all(
    [...idsByCollection.entries()].map(async ([collection, ids]) => {
      const result = await payload.find({
        collection: collection as never,
        depth: 2,
        limit: ids.length,
        overrideAccess: false,
        pagination: false,
        where: {
          id: {
            in: ids,
          },
        },
      });

      docsByCollection.set(
        collection,
        new Map(
          (result.docs as CMSDoc[])
            .filter((doc) => doc.id != null)
            .map((doc) => [doc.id as number | string, doc]),
        ),
      );
    }),
  );

  return rows
    .map((row) => {
      const collection = row.doc?.relationTo;
      const id = relationshipId(row.doc?.value);
      if (!collection || id == null) return undefined;

      return {
        collection,
        doc: docsByCollection.get(collection)?.get(id),
        priority: asNumber(row.priority, 50),
      };
    })
    .filter((entry): entry is { collection: string; doc: CMSDoc; priority: number } =>
      Boolean(entry?.doc),
    );
};

const guideItemHref = (prefix: string, citySlug: string, kind: string, slug: string) =>
  `${prefix}/city/${citySlug}/${kind}/${slug}`;

const listingHref = (
  prefix: string,
  citySlug: string,
  listingType: string,
  slug: string,
) => {
  if (listingType === "islamic-landmark") return `${prefix}/city/${citySlug}/place/${slug}`;
  if (listingType === "prayer-area") return `${prefix}/city/${citySlug}/islamic-travel`;
  return `${prefix}/city/${citySlug}/${listingType}/${slug}`;
};

const indexedEntryToDocument = (
  entry: { collection: string; doc: CMSDoc; priority: number },
  locale: SearchLocale,
): SearchDocument | undefined => {
  const labels = resultLabels(locale);
  const prefix = locale === "ar" ? "/ar" : "/en";
  const { collection, doc, priority } = entry;

  if (collection === "cities") {
    const slug = asString(doc.slug);
    if (!slug) return undefined;
    const title = localizedCityName({ name: asString(doc.name), slug }, locale);
    const country = localizedCountry(relationshipName(doc.country), slug, locale);

    return makeDocument({
      id: `city:${slug}`,
      title,
      subtitle: country,
      type: "city",
      href: `${prefix}/city/${slug}`,
      image: mediaUrl(doc.heroImage, ["card", "hero"]) || undefined,
      city: title,
      label: labels.city,
      priority: Math.max(priority, 100),
      body: `${asString(doc.lede)} ${asString(doc.region)} ${asString(doc.currency)}`,
      description: asString(doc.lede),
    });
  }

  const city = citySummaryFromRelationship(doc.city, locale);
  if (!city) return undefined;

  if (collection === "guide-items") {
    const kind = asString(doc.kind, "place");
    if (!isGuideItemResultType(kind)) return undefined;
    const slug = asString(doc.slug);
    if (!slug) return undefined;
    const title = localizedField(doc, locale, "title");
    const area = localizedField(doc, locale, "area");
    const description = localizedField(doc, locale, "summary");

    return makeDocument({
      id: `item:${city.slug}:${kind}:${slug}`,
      title,
      subtitle: area
        ? `${kindSingular[kind][locale]} · ${area}`
        : `${kindSingular[kind][locale]} · ${city.name}`,
      type: kind,
      href: guideItemHref(prefix, city.slug, kind, slug),
      image: mediaUrl(doc.image, ["card", "hero"]) || city.image,
      city: city.name,
      label: kindSingular[kind][locale],
      priority: kind === "place" ? Math.max(priority, 84) : Math.max(priority, 78),
      body: `${kindSingular[kind].en} ${kindSingular[kind].ar} ${description} ${asString(doc.category)} ${area}`,
      description,
    });
  }

  if (collection === "guide-sections") {
    const sectionSlug = asString(doc.sectionSlug);
    if (!sectionSlug) return undefined;
    const title =
      sectionTitleByLocale[locale][sectionSlug] ?? localizedField(doc, locale, "title");
    const summary = localizedField(doc, locale, "summary");

    return makeDocument({
      id: `section:${city.slug}:${sectionSlug}`,
      title,
      subtitle:
        locale === "ar" ? `${labels.section} في ${city.name}` : `${labels.section} in ${city.name}`,
      type: "section",
      href: `${prefix}/city/${city.slug}/section/${sectionSlug}`,
      image: city.image,
      city: city.name,
      label: labels.section,
      priority: Math.max(priority, 70),
      body: summary,
      description: summary,
    });
  }

  if (collection === "neighborhoods") {
    const slug = asString(doc.slug);
    if (!slug) return undefined;
    const title = localizedField(doc, locale, "name");
    const summary = localizedField(doc, locale, "operatingGuide");

    return makeDocument({
      id: `neighborhood:${city.slug}:${slug}`,
      title,
      subtitle:
        locale === "ar"
          ? `${labels.neighborhood} في ${city.name}`
          : `${labels.neighborhood} in ${city.name}`,
      type: "neighborhood",
      href: `${prefix}/city/${city.slug}/neighborhood/${slug}`,
      image: mediaUrl(doc.image, ["card", "hero"]) || city.image,
      city: city.name,
      label: labels.neighborhood,
      priority: Math.max(priority, 76),
      body: summary,
      description: summary,
    });
  }

  if (collection === "listings") {
    const slug = asString(doc.slug);
    const listingType = asString(doc.listingType, "place");
    if (!slug) return undefined;
    const type =
      listingType === "islamic-landmark"
        ? "place"
        : listingType === "prayer-area"
          ? "masjid"
          : (listingType as SiteSearchResult["type"]);
    if (!isGuideItemResultType(type)) return undefined;
    const title = localizedField(doc, locale, "name");
    const description = localizedField(doc, locale, "shortDescription");

    return makeDocument({
      id: `listing:${city.slug}:${listingType}:${slug}`,
      title,
      subtitle: `${kindSingular[type][locale]} · ${city.name}`,
      type,
      href: listingHref(prefix, city.slug, listingType, slug),
      image: mediaUrl(doc.image, ["card", "hero"]) || city.image,
      city: city.name,
      label: kindSingular[type][locale],
      priority: Math.max(priority, 70),
      body: `${kindSingular[type].en} ${kindSingular[type].ar} ${description} ${asString(doc.address)}`,
      description,
    });
  }

  if (collection === "itineraries") {
    const slug = asString(doc.slug);
    if (!slug) return undefined;
    const title = localizedField(doc, locale, "title");
    const summary = localizedField(doc, locale, "summary");

    return makeDocument({
      id: `itinerary:${city.slug}:${slug}`,
      title,
      subtitle:
        locale === "ar"
          ? `${labels.itinerary} في ${city.name}`
          : `${labels.itinerary} in ${city.name}`,
      type: "itinerary",
      href: `${prefix}/city/${city.slug}/itineraries/${slug}`,
      image: city.image,
      city: city.name,
      label: labels.itinerary,
      priority: Math.max(priority, 65),
      body: summary,
      description: summary,
    });
  }

  return undefined;
};

const getIndexedSearchDocuments = unstable_cache(
  async (
    locale: SearchLocale,
    normalizedQuery: string,
    requestedLimit: number,
  ): Promise<SearchDocument[]> => {
    if (!isCMSConfigured() || normalizedQuery.length < 2) return [];

    const payload = await getPayload({ config });
    const searchLimit = Math.min(Math.max(requestedLimit * 4, 24), 80);
    const searchRows = await payload.find({
      collection: "search" as never,
      depth: 0,
      limit: searchLimit,
      overrideAccess: false,
      sort: "-priority,title",
      where: {
        title: {
          like: normalizedQuery,
        },
      },
    });

    const hydrated = await hydrateIndexedRows(searchRows.docs as IndexedSearchRow[]);
    return hydrated
      .map((entry) => indexedEntryToDocument(entry, locale))
      .filter((document): document is SearchDocument => Boolean(document));
  },
  ["irhal-indexed-search-documents-v2"],
  {
    revalidate: 60 * 5,
    tags: ["irhal-city-search:indexed"],
  },
);

const buildCityDocuments = async (locale: SearchLocale): Promise<SearchDocument[]> => {
  const labels = resultLabels(locale);
  const navItems = await getCityNavItems();
  const documents: SearchDocument[] = [];

  for (const navCity of navItems) {
    const city = await getCityBySlug(navCity.slug);
    if (!city) continue;

    const cityName = localizedCityName(city, locale);
    const countryName = localizedCountry(city.country, city.slug, locale);
    const prefix = locale === "ar" ? "/ar" : "/en";

    documents.push(
      makeDocument({
        id: `city:${city.slug}`,
        title: cityName,
        subtitle: countryName,
        type: "city",
        href: `${prefix}/city/${city.slug}`,
        image: getCityHeroImage(city),
        city: cityName,
        label: labels.city,
        priority: 100,
        body: `${city.lede} ${city.region} ${city.currency} ${city.languages.join(" ")}`,
      }),
    );

    for (const neighborhood of city.neighborhoods) {
      documents.push(
        makeDocument({
          id: `neighborhood:${city.slug}:${neighborhood.slug}`,
          title: neighborhood.name,
          subtitle:
            locale === "ar"
              ? `${labels.neighborhood} في ${cityName}`
              : `${labels.neighborhood} in ${cityName}`,
          type: "neighborhood",
          href: `${prefix}/city/${city.slug}/neighborhood/${neighborhood.slug}`,
          image: getCityHeroImage(city),
          city: cityName,
          label: labels.neighborhood,
          priority: 76,
          body: `${neighborhood.operatingGuide} ${neighborhood.bestFor.join(" ")} ${neighborhood.zone} ${neighborhood.clusterType}`,
        }),
      );
    }

    for (const section of sectionCards) {
      documents.push(
        makeDocument({
          id: `section:${city.slug}:${section.slug}`,
          title: sectionTitleByLocale[locale][section.slug] ?? section.title,
          subtitle:
            locale === "ar"
              ? `${labels.section} في ${cityName}`
              : `${labels.section} in ${cityName}`,
          type: "section",
          href: `${prefix}/city/${city.slug}/section/${section.slug}`,
          image: getCityHeroImage(city),
          city: cityName,
          label: labels.section,
          priority: 70,
          body: section.summary,
          description: section.summary,
        }),
      );

      for (const rawArticle of getGuideArticlesForSection(city, section.slug)) {
        const article = localizeGuideArticle(rawArticle, locale);
        documents.push(
          makeDocument({
            id: `article:${city.slug}:${section.slug}:${article.slug}`,
            title: article.title,
            subtitle:
              locale === "ar"
                ? `${labels.article} في ${cityName}`
                : `${labels.article} in ${cityName}`,
            type: "article",
            href: `${prefix}/city/${city.slug}/section/${section.slug}/${article.slug}`,
            image: getCityHeroImage(city),
            city: cityName,
            label: labels.article,
            priority: 58,
            body: article.summary,
            description: article.summary,
          }),
        );
      }
    }

    for (const rawItem of getGuideItems(city)) {
      const item = localizeGuideItem(rawItem, locale);
      const visual = getGuideItemImage(item);
      documents.push(
        makeDocument({
          id: `item:${city.slug}:${item.kind}:${item.slug}`,
          title: item.title,
          subtitle: item.area
            ? `${kindSingular[item.kind][locale]} · ${item.area}`
            : `${kindSingular[item.kind][locale]} · ${cityName}`,
          type: item.kind,
          href: `${prefix}${pathForGuideItem(city, item)}`,
          image: visual.image,
          city: cityName,
          label: kindSingular[item.kind][locale],
          priority: item.kind === "place" ? 84 : 78,
          body: `${kindSingular[item.kind].en} ${kindSingular[item.kind].ar} ${item.description} ${item.category} ${item.area} ${item.originalContent?.join(" ") ?? ""}`,
          description: item.description,
        }),
      );
    }
  }

  return documents;
};

const getCachedSearchDocuments = unstable_cache(
  async (locale: SearchLocale) => buildCityDocuments(locale),
  ["irhal-city-search-documents-v1"],
  {
    revalidate: searchIndexRevalidateSeconds,
    tags: ["irhal-city-search:documents"],
  },
);

const getSearchDocuments = async (locale: SearchLocale) => {
  const cached = searchCache.get(locale);
  if (cached && cached.expiresAt > Date.now()) return cached.documents;

  const documents = await getCachedSearchDocuments(locale);
  searchCache.set(locale, {
    documents,
    expiresAt: Date.now() + searchCacheTtlMs,
  });
  return documents;
};

export const searchSite = async ({
  citySlug,
  limit = 8,
  locale = "en",
  query,
}: {
  citySlug?: string;
  limit?: number;
  locale?: SearchLocale;
  query: string;
}): Promise<SiteSearchResult[]> => {
  const normalizedQuery = normalize(query);
  const normalizedCitySlug = citySlug?.trim().toLowerCase();
  const cityScopedDocuments = (documents: SearchDocument[]) =>
    normalizedCitySlug
      ? documents.filter(
          (document) =>
            document.id.includes(`:${normalizedCitySlug}`) ||
            document.href.includes(`/city/${normalizedCitySlug}`),
        )
      : documents;

  if (isCMSConfigured() && normalizedQuery.length >= 2) {
    try {
      const sqlDocuments = await getSqlSearchDocuments(
        locale,
        normalizedQuery,
        limit,
      );
      const rankedSqlDocuments = cityScopedDocuments(sqlDocuments)
        .map((document) => ({
          ...document,
          score: documentScore(document, normalizedQuery),
        }))
        .filter((result) => result.score > result.priority - 20)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

      if (rankedSqlDocuments.length > 0) {
        return removeDuplicateEntities(rankedSqlDocuments)
          .slice(0, limit)
          .map(toPublicResult);
      }

      const indexedDocuments = await getIndexedSearchDocuments(
        locale,
        normalizedQuery,
        limit,
      );
      const rankedIndexedDocuments = cityScopedDocuments(indexedDocuments)
        .map((document) => ({
          ...document,
          score: documentScore(document, normalizedQuery),
        }))
        .filter((result) => result.score > result.priority - 20)
        .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

      return removeDuplicateEntities(rankedIndexedDocuments)
        .slice(0, limit)
        .map(toPublicResult);
    } catch (error) {
      console.error("CMS search failed", error);
      return [];
    }
  }

  let documents: SearchDocument[];
  try {
    documents = await getSearchDocuments(locale);
  } catch (error) {
    console.error("Search index build failed", error);
    return [];
  }

  const rankedDocuments = cityScopedDocuments(documents)
    .map((document) => ({
      ...document,
      score: documentScore(document, normalizedQuery),
    }))
    .filter((result) => (normalizedQuery ? result.score > result.priority - 20 : result.type === "city"))
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));

  return removeDuplicateEntities(rankedDocuments)
    .slice(0, limit)
    .map(toPublicResult);
};
