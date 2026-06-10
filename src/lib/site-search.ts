import { unstable_cache } from "next/cache";

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
    | "tour";
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

const guideItemResultTypes = new Set<SiteSearchResult["type"]>([
  "family",
  "festival",
  "hotel",
  "masjid",
  "place",
  "restaurant",
  "shopping",
  "tour",
]);

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
        neighborhood: "منطقة",
        section: "قسم",
      }
    : {
        article: "Article",
        city: "City guide",
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

  if (normalizedTitle === normalize(query)) score += 180;
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
      .filter((document) => guideItemResultTypes.has(document.type))
      .map((document) => `${document.city ?? ""}:${titleEntityKey(document.title, document.city)}`),
  );
  const seenEntityKeys = new Set<string>();

  return documents.filter((document) => {
    if (document.type !== "article" && !guideItemResultTypes.has(document.type)) {
      return true;
    }

    const key = `${document.city ?? ""}:${titleEntityKey(document.title, document.city)}`;
    if (document.type === "article" && guideItemEntityKeys.has(key)) return false;
    if (seenEntityKeys.has(key)) return false;

    seenEntityKeys.add(key);
    return true;
  });
};

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
  limit = 8,
  locale = "en",
  query,
}: {
  limit?: number;
  locale?: SearchLocale;
  query: string;
}): Promise<SiteSearchResult[]> => {
  let documents: SearchDocument[];
  try {
    documents = await getSearchDocuments(locale);
  } catch (error) {
    console.error("Search index build failed", error);
    return [];
  }

  const normalizedQuery = normalize(query);

  const rankedDocuments = documents
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
