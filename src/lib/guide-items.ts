import type { CityGuide, GuideBlock } from "./city-data";
import { getGuideSection, getGuideTable } from "./city-data";
import { getGuideItemImage, hasGuideItemMedia } from "./city-presentation";
import karachiIrhalLegacyArticleUpdates from "../data/karachi-irhal-legacy-article-updates.json";

export type GuideItemKind = "place" | "hotel" | "restaurant" | "masjid" | "shopping" | "tour" | "family" | "festival";

export const guideKindOrder: GuideItemKind[] = [
  "place",
  "restaurant",
  "hotel",
  "shopping",
  "festival",
  "masjid",
  "tour",
  "family",
];

export const kindPlural: Record<GuideItemKind, { ar: string; en: string }> = {
  family: { ar: "أماكن عائلية", en: "family spots" },
  festival: { ar: "فعاليات", en: "festivals" },
  hotel: { ar: "فنادق", en: "hotels" },
  masjid: { ar: "مساجد", en: "masjids" },
  place: { ar: "أماكن", en: "places" },
  restaurant: { ar: "مطاعم", en: "restaurants" },
  shopping: { ar: "أماكن تسوق", en: "shopping spots" },
  tour: { ar: "جولات", en: "tours" },
};

export const kindSingular: Record<GuideItemKind, { ar: string; en: string }> = {
  family: { ar: "مكان عائلي", en: "Family spot" },
  festival: { ar: "فعالية", en: "Festival" },
  hotel: { ar: "فندق", en: "Hotel" },
  masjid: { ar: "مسجد", en: "Masjid" },
  place: { ar: "معلم", en: "Place" },
  restaurant: { ar: "مطعم", en: "Restaurant" },
  shopping: { ar: "تسوق", en: "Shopping" },
  tour: { ar: "جولة", en: "Tour" },
};

export type GuideItem = {
  id: string;
  citySlug: string;
  kind: GuideItemKind;
  sectionSlug: string;
  sourceTable: string;
  title: string;
  slug: string;
  eyebrow: string;
  area: string;
  neighborhoodSlug?: string;
  category: string;
  description: string;
  budget?: string;
  mapUrl?: string;
  imageUrl: string;
  imageAlt: string;
  translations?: Record<string, Record<string, unknown>>;
  details: Record<string, string>;
  originalContent?: string[];
  originalLocation?: string;
  cmsImageUrl?: string;
  galleryUrls?: string[];
  updatedAt?: string;
  createdAt?: string;
  geoStatus: "provider-enrichment-required" | "verified";
};

export type GuideSectionCard = {
  title: string;
  slug: string;
  summary: string;
  icon: "award" | "calendar" | "book" | "train" | "building" | "map" | "wallet" | "family" | "shield";
};

export type GuideArticle = {
  contentSource?: CityGuide["contentSource"];
  citySlug: string;
  sectionSlug: string;
  title: string;
  slug: string;
  summary: string;
  imageAlt?: string;
  imageUrl?: string;
  blocks: GuideBlock[];
  translations?: Record<string, Record<string, unknown>>;
};

export type IrhalLegacyArticleUpdate = {
  sectionSlug: string;
  articleSlug: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceModifiedAt: string;
  editorialUpdate: string;
  verificationNote: string;
};

// Public guide item order must be stable. Do not reorder by media presence or
// updatedAt, because ordinary CMS edits would move items around the public site.
const sortGuideItemsForEditorialDisplay = (items: GuideItem[]) => items;

const irhalLegacyArticleUpdateByKey = (
  karachiIrhalLegacyArticleUpdates as IrhalLegacyArticleUpdate[]
).reduce<Map<string, IrhalLegacyArticleUpdate[]>>((updatesByKey, update) => {
  const key = `${update.sectionSlug}:${update.articleSlug}`;
  updatesByKey.set(key, [...(updatesByKey.get(key) ?? []), update]);
  return updatesByKey;
}, new Map());

const withIrhalLegacyArticleUpdate = (article: GuideArticle): GuideArticle => {
  return article;
};

export const getIrhalLegacyArticleUpdate = (
  sectionSlug: string,
  articleSlug: string,
) => irhalLegacyArticleUpdateByKey.get(`${sectionSlug}:${articleSlug}`) ?? [];

export const itineraryGuideSectionSlug = "city-in-a-day-and-longer-itineraries";

export const sectionCards: GuideSectionCard[] = [
  {
    title: "Itineraries",
    slug: itineraryGuideSectionSlug,
    summary: "One-day, two-day, three-day, old-city, and beach clusters.",
    icon: "calendar",
  },
  {
    title: "Visitor Information",
    slug: "visitor-information",
    summary: "Visa notes, fast facts, exchange references, holidays, climate, and arrival basics.",
    icon: "book",
  },
  {
    title: "Festivals and Annual Events",
    slug: "festivals-and-annual-events",
    summary: "Month-by-month Karachi events, holidays, food seasons, and cultural dates.",
    icon: "calendar",
  },
  {
    title: "Transportation",
    slug: "transportation-and-getting-around",
    summary: "Airport, buses, ride-hailing, private drivers, and cluster-first movement advice.",
    icon: "train",
  },
  {
    title: "City Information",
    slug: "city-information",
    summary: "Karachi today, Karachi back then, residents, culture, and city character.",
    icon: "building",
  },
  {
    title: "Best Neighborhoods",
    slug: "neighborhood-operating-guide",
    summary: "Where to stay, eat, pray, shop, and plan your movement across the city.",
    icon: "map",
  },
  {
    title: "Hotels",
    slug: "hotels",
    summary: "Location-led hotel choices across luxury, moderate, airport, and central stays.",
    icon: "building",
  },
  {
    title: "Best Things To Do",
    slug: "places-to-visit",
    summary: "Attractions, landmarks, museums, beaches, shrines, parks, and heritage stops.",
    icon: "award",
  },
  {
    title: "Shopping",
    slug: "shopping",
    summary: "Malls, markets, fashion streets, book bazaars, and souvenir districts.",
    icon: "wallet",
  },
  {
    title: "Food and Restaurants",
    slug: "food-and-restaurants",
    summary: "Halal-aware food districts and restaurant pages from Burns Road to DHA.",
    icon: "award",
  },
  {
    title: "Organized Tours",
    slug: "organized-tours",
    summary: "Heritage walks, food crawls, museum circuits, coastal trips, and family days.",
    icon: "map",
  },
  {
    title: "Health and Safety",
    slug: "health-and-safety",
    summary: "Practical safety, water, food, weather, transport, and emergency guidance.",
    icon: "shield",
  },
  {
    title: "Traveling With Kids",
    slug: "children-in-tow",
    summary: "Child-friendly attractions and family pacing advice for heat and traffic.",
    icon: "family",
  },
  {
    title: "Muslim Visitor Information",
    slug: "muslim-visitor-information",
    summary: "Halal food, masjids, prayer etiquette, and live mosque locator pages.",
    icon: "award",
  },
  {
    title: "Data Resources",
    slug: "data-resources-and-update-workflow",
    summary: "Source list, Google Maps workflow, update cadence, and editorial checklist.",
    icon: "book",
  },
];

const internalSectionSlugs = new Set(["data-resources-and-update-workflow"]);

export const isPublicGuideSection = (slug: string) =>
  !internalSectionSlugs.has(slug);

export const publicSectionCards = sectionCards.filter((card) =>
  isPublicGuideSection(card.slug),
);

export const getLocalizedGuideSectionCopy = (
  city: CityGuide,
  sectionSlug: string,
  locale: "en" | "ar",
) => {
  const guideSection = getGuideSection(city, sectionSlug);
  const card = sectionCards.find((item) => item.slug === sectionSlug);
  const translation = guideSection?.translations?.[locale];
  const fallbackTitle =
    guideSection?.title.replace(/^[0-9]+\.\s*/, "") ??
    card?.title ??
    sectionSlug;
  const fallbackSummary =
    guideSection?.summary ??
    card?.summary ??
    `${fallbackTitle} from the Irhal city guide.`;

  if (locale === "ar") {
    return {
      summary: asArabicText(
        translation?.summary,
        "ملخص هذا القسم غير مكتمل في نظام إدارة المحتوى.",
      ),
      title: asArabicText(translation?.title, "قسم قيد الترجمة"),
    };
  }

  return {
    summary:
      typeof translation?.summary === "string" && translation.summary.trim()
        ? translation.summary
        : fallbackSummary,
    title:
      typeof translation?.title === "string" && translation.title.trim()
        ? translation.title
        : fallbackTitle,
  };
};

export const slugifyGuideItem = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const arabicTextPattern = /[\u0600-\u06ff]/;

const hasArabicText = (value: unknown): value is string =>
  typeof value === "string" && arabicTextPattern.test(value);

const asArabicText = (value: unknown, fallback: string) =>
  hasArabicText(value) ? value.trim() : fallback;

const asLocalizedParagraphs = (value: unknown): string[] | undefined => {
  if (Array.isArray(value)) {
    const paragraphs = value.filter(
      (paragraph): paragraph is string =>
        typeof paragraph === "string" && paragraph.trim().length > 0,
    );
    return paragraphs.length > 0 ? paragraphs : undefined;
  }

  if (typeof value === "string" && value.trim()) {
    const paragraphs = value
      .split(/\n{2,}/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    return paragraphs.length > 0 ? paragraphs : undefined;
  }

  return undefined;
};

const asArabicParagraphs = (value: unknown): string[] | undefined => {
  const paragraphs = asLocalizedParagraphs(value)?.filter(hasArabicText);
  return paragraphs && paragraphs.length > 0 ? paragraphs : undefined;
};

export const hasArabicGuideItemCopy = (item: GuideItem) => {
  const translation = item.translations?.ar ?? {};
  const hasTitle = hasArabicText(translation.title ?? translation.name);
  const hasSummary = hasArabicText(
    translation.summary ?? translation.description,
  );
  const hasBody =
    Boolean(asArabicParagraphs(translation.overview)) ||
    Boolean(asArabicParagraphs(translation.body)) ||
    hasSummary;

  return hasTitle && hasSummary && hasBody;
};

const arabicKindLabel: Record<GuideItemKind, string> = {
  family: "عائلي",
  festival: "فعالية",
  hotel: "فندق",
  masjid: "مسجد",
  place: "معلم",
  restaurant: "مطعم",
  shopping: "تسوق",
  tour: "جولة",
};

const arabicAreaLabel: Record<string, string> = {
  "airport": "المطار",
  "airport and malir": "المطار وملير",
  "burns garden": "بيرنز غاردن",
  "burns road": "بيرنز رود",
  "central": "وسط المدينة",
  "civil lines": "سيفيل لاينز",
  "clifton": "كليفتون",
  "dha": "دي إتش إيه",
  "gulshan-e-iqbal": "غلشن إقبال",
  "karachi": "كراتشي",
  "malir": "ملير",
  "saddar": "صدر",
  "tariq road": "طارق رود",
};

const localizeKnownArabicArea = (area: string) =>
  arabicAreaLabel[area.toLowerCase()];

const withTranslations = (city: CityGuide, item: GuideItem): GuideItem => {
  const cmsTranslations =
    city.guideItemTranslations?.[`${item.kind}:${item.slug}`] ??
    city.guideItemTranslations?.[item.slug];
  const translations = cmsTranslations
    ? { ...(item.translations ?? {}), ...cmsTranslations }
    : item.translations;

  return translations ? { ...item, translations } : item;
};

export const localizeGuideItem = (
  item: GuideItem,
  locale: "en" | "ar",
): GuideItem => {
  if (locale === "en") return item;

  const translation = item.translations?.[locale] ?? {};
  const missingCopy =
    "المحتوى العربي لهذا العنصر غير مكتمل في نظام إدارة المحتوى.";
  const area = asArabicText(
    translation.area,
    localizeKnownArabicArea(item.area) ?? "غير محدد",
  );
  const category = asArabicText(
    translation.category,
    arabicKindLabel[item.kind],
  );
  const description = asArabicText(
    translation.summary ?? translation.description,
    missingCopy,
  );
  const overview =
    asArabicParagraphs(translation.overview) ??
    asArabicParagraphs(translation.body) ??
    [description];
  const title = asArabicText(
    translation.title ?? translation.name,
    `${arabicKindLabel[item.kind]} قيد الترجمة`,
  );
  const address = asArabicText(
    translation.address,
    "العنوان العربي غير مكتمل في نظام إدارة المحتوى.",
  );

  return {
    ...item,
    area,
    category,
    description,
    eyebrow: asArabicText(translation.eyebrow, `${category} في ${area}`),
    imageAlt: asArabicText(translation.imageAlt, title),
    title,
    // Localize the long-form overview/address too, so cards and detail pages
    // never fall through to the English Payload fields on Arabic routes.
    originalContent: overview,
    originalLocation: address,
  };
};

export const getGuideItems = (city: CityGuide): GuideItem[] => {
  return sortGuideItemsForEditorialDisplay(
    (city.guideItems ?? []).map((item) => withTranslations(city, item)),
  );
};

export const getGuideItemsForSection = (city: CityGuide, sectionSlug: string) =>
  getGuideItems(city).filter((item) => item.sectionSlug === sectionSlug);

export const getGuideItemsByKind = (city: CityGuide, kind: GuideItemKind) =>
  getGuideItems(city).filter((item) => item.kind === kind);

export const getGuideItem = (city: CityGuide, kind: GuideItemKind, slug: string) =>
  getGuideItemsByKind(city, kind).find((item) => item.slug === slug);

const canonicalArticleByGuideItemSlug: Record<
  string,
  { articleSlug: string; sectionSlug: string }
> = {
  "london-currency-and-exchange-rates": {
    articleSlug: "exchange-rates",
    sectionSlug: "visitor-information",
  },
  "london-fast-facts": {
    articleSlug: "fast-facts",
    sectionSlug: "visitor-information",
  },
  "driving-tips-for-london": {
    articleSlug: "driving-tips",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-buses": {
    articleSlug: "buses",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-history": {
    articleSlug: "city-back-then",
    sectionSlug: "city-information",
  },
  "london-public-holidays": {
    articleSlug: "public-holidays-england-and-wales-2026",
    sectionSlug: "visitor-information",
  },
  "london-today": {
    articleSlug: "city-today",
    sectionSlug: "city-information",
  },
  "london-taxis": {
    articleSlug: "taxis-and-ride-hailing",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-underground-tube": {
    articleSlug: "underground-and-elizabeth-line",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-visa-information": {
    articleSlug: "visa-and-eta-information",
    sectionSlug: "visitor-information",
  },
  "london-weather-and-annual-temperature": {
    articleSlug: "annual-temperature-and-rainfall",
    sectionSlug: "visitor-information",
  },
  "when-to-go-to-london": {
    articleSlug: "when-to-go",
    sectionSlug: "visitor-information",
  },
};

export const canonicalArticlePathForGuideItem = (
  city: CityGuide,
  item: GuideItem,
) => {
  const canonicalArticle = canonicalArticleByGuideItemSlug[item.slug];
  if (!canonicalArticle || item.sectionSlug !== canonicalArticle.sectionSlug) {
    return undefined;
  }
  return `/city/${city.slug}/section/${canonicalArticle.sectionSlug}/${canonicalArticle.articleSlug}`;
};

export const pathForGuideItem = (city: CityGuide, item: GuideItem) => {
  const articlePath = canonicalArticlePathForGuideItem(city, item);
  if (articlePath) return articlePath;
  if (item.kind === "family") return `/city/${city.slug}/family/${item.slug}`;
  return `/city/${city.slug}/${item.kind}/${item.slug}`;
};

const stripLeadingSectionNumber = (value: string) =>
  value.replace(/^[0-9]+[.)]?\s*/, "").trim();

export const isSectionIntroArticle = (
  city: CityGuide,
  sectionSlug: string,
  article: Pick<GuideArticle, "slug" | "title">,
) => {
  const section = getGuideSection(city, sectionSlug);
  const sectionTitle = stripLeadingSectionNumber(
    section?.title ?? sectionCards.find((card) => card.slug === sectionSlug)?.title ?? sectionSlug,
  );
  const articleTitle = stripLeadingSectionNumber(article.title);

  return (
    article.slug === sectionSlug ||
    article.slug === slugifyGuideItem(sectionTitle) ||
    slugifyGuideItem(articleTitle) === slugifyGuideItem(sectionTitle)
  );
};

const articleTablePurpose = (
  sectionSlug: string,
  articleSlug: string,
): string | undefined => {
  if (sectionSlug === "visitor-information") {
    if (articleSlug === "fast-facts") return "fast_facts";
    if (articleSlug === "public-holidays") return "public_holidays";
    if (articleSlug === "when-to-go") return "climate";
  }

  if (
    sectionSlug === "health-and-safety" &&
    articleSlug === "useful-emergency-numbers"
  ) {
    return "emergency_numbers";
  }

  return undefined;
};

const articleTableHeading: Record<string, string> = {
  climate: "Annual temperature and climate guide",
  emergency_numbers: "Emergency numbers",
  fast_facts: "Fast facts",
  public_holidays: "Public holidays",
};

const normalizeArticleSummaryText = (value: string) =>
  value
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const tableRowSummary = (block: Extract<GuideBlock, { type: "table" }>) =>
  block.rows
    .slice(0, 3)
    .map((row) => {
      const values = row.values;
      const first =
        values.service ??
        values.label ??
        values.name ??
        Object.values(values).find(Boolean);
      const second =
        values.number_contact ??
        values.value ??
        values.contact ??
        Object.values(values).filter(Boolean)[1];

      if (first && second) return `${first}: ${second}`;

      return Object.values(values).filter(Boolean).slice(0, 2).join(": ");
    })
    .filter(Boolean)
    .join("; ");

const summaryFromBlocks = (blocks: GuideBlock[]) => {
  const paragraph = blocks.find(
    (block): block is Extract<GuideBlock, { type: "paragraph" }> =>
      block.type === "paragraph" &&
      !block.style.toLowerCase().startsWith("heading") &&
      Boolean(block.text.trim()),
  );

  if (paragraph) return normalizeArticleSummaryText(paragraph.text);

  const table = blocks.find(
    (block): block is Extract<GuideBlock, { type: "table" }> =>
      block.type === "table",
  );

  return table ? normalizeArticleSummaryText(tableRowSummary(table)) : "";
};

const withArticleSummary = (article: GuideArticle): GuideArticle => {
  const summary = normalizeArticleSummaryText(article.summary);
  const derivedSummary = summaryFromBlocks(article.blocks);
  const isWeakSummary = summary.split(/\s+/).filter(Boolean).length < 3;

  return {
    ...article,
    summary: isWeakSummary && derivedSummary ? derivedSummary : summary,
  };
};

const withArticleTable = (city: CityGuide, article: GuideArticle): GuideArticle => {
  const purpose = articleTablePurpose(article.sectionSlug, article.slug);
  if (!purpose || article.blocks.some((block) => block.type === "table" && block.purpose === purpose)) {
    return article;
  }

  const table = getGuideTable(city, purpose);
  if (!table) return article;

  return {
    ...article,
    blocks: [
      ...article.blocks,
      {
        type: "paragraph",
        style: "Heading 2",
        text: articleTableHeading[purpose] ?? table.purpose,
        links: [],
      },
      table,
    ],
  };
};

const withGuideArticleTranslations = (
  city: CityGuide,
  article: GuideArticle,
): GuideArticle => {
  const translations =
    city.guideArticleTranslations?.[`${article.sectionSlug}:${article.slug}`];
  return translations ? { ...article, translations } : article;
};

type ArticleMediaTarget = {
  kind: GuideItemKind;
  slug: string;
};

const articleMediaTargetsByCity: Record<
  string,
  Record<string, ArticleMediaTarget[]>
> = {
  london: {
    "transportation-and-getting-around:buses": [
      { kind: "tour", slug: "london-buses" },
      { kind: "tour", slug: "big-bus-london-sightseeing-tour" },
    ],
    "transportation-and-getting-around:driving-tips": [
      { kind: "shopping", slug: "seven-dials" },
    ],
    "transportation-and-getting-around:from-gatwick": [
      { kind: "place", slug: "king-s-cross-and-st-pancras" },
    ],
    "transportation-and-getting-around:from-heathrow": [
      { kind: "place", slug: "king-s-cross-and-st-pancras" },
    ],
    "transportation-and-getting-around:national-rail-and-overground": [
      { kind: "place", slug: "king-s-cross-and-st-pancras" },
    ],
    "transportation-and-getting-around:taxis-and-ride-hailing": [
      { kind: "shopping", slug: "seven-dials" },
      { kind: "tour", slug: "london-taxis" },
    ],
    "transportation-and-getting-around:underground-and-elizabeth-line": [
      { kind: "place", slug: "king-s-cross-and-st-pancras" },
      { kind: "tour", slug: "london-underground-tube" },
    ],
  },
};

const withGuideArticleMedia = (
  city: CityGuide,
  article: GuideArticle,
): GuideArticle => {
  if (article.imageUrl?.trim()) return article;

  const targets =
    articleMediaTargetsByCity[city.slug]?.[
      `${article.sectionSlug}:${article.slug}`
    ] ?? [];
  const item = targets
    .map((target) => getGuideItem(city, target.kind, target.slug))
    .find((candidate): candidate is GuideItem =>
      Boolean(candidate && hasGuideItemMedia(candidate)),
    );

  if (!item) return article;

  return {
    ...article,
    imageAlt: article.imageAlt || item.imageAlt,
    imageUrl: getGuideItemImage(item).image,
  };
};

export const getGuideArticlesForSection = (city: CityGuide, sectionSlug: string): GuideArticle[] => {
  const section = getGuideSection(city, sectionSlug);
  if (!section) return [];

  const articles: GuideArticle[] = [];
  let current: GuideArticle | null = null;

  for (const block of section.blocks) {
    if (block.type === "table") {
      if (!current) {
        current = {
          citySlug: city.slug,
          sectionSlug,
          title: section.title.replace(/^[0-9]+\\.\\s*/, ""),
          slug: slugifyGuideItem(section.title),
          summary: "",
          blocks: [],
          contentSource: city.contentSource,
        };
      }
      current.blocks.push(block);
      continue;
    }

    if (block.style === "Heading 2" || block.style === "Heading 3") {
      const headingSlug = block.articleSlug || slugifyGuideItem(block.text);
      const continuesWhenToGo =
        sectionSlug === "visitor-information" &&
        current?.slug === "when-to-go" &&
        headingSlug === "annual-temperature-and-climate-guide";
      const continuesHealthAndSafetyArticle =
        sectionSlug === "health-and-safety" &&
        current?.slug === "health-and-safety" &&
        block.style === "Heading 3";

      if ((continuesWhenToGo || continuesHealthAndSafetyArticle) && current) {
        current.blocks.push(block);
        continue;
      }

      if (current) articles.push(current);
      current = {
        citySlug: city.slug,
        sectionSlug,
        title: block.text,
        slug: headingSlug,
        summary: "",
        imageAlt: block.imageAlt,
        imageUrl: block.imageUrl,
        blocks: [],
        contentSource: city.contentSource,
      };
      continue;
    }

    if (!current) {
      current = {
        citySlug: city.slug,
        sectionSlug,
        title: section.title.replace(/^[0-9]+\\.\\s*/, ""),
        slug: slugifyGuideItem(section.title),
        summary: "",
        blocks: [],
        contentSource: city.contentSource,
      };
    }

    if (!current.summary && block.text) {
      current.summary = block.text;
    }
    current.blocks.push(block);
  }

  if (current) articles.push(current);
  const hasSectionItems = getGuideItemsForSection(city, sectionSlug).length > 0;
  const normalizedArticles = articles
    .filter((article) => article.summary || article.blocks.length > 0)
    .filter(
      (article) =>
        !hasSectionItems ||
        !isSectionIntroArticle(city, sectionSlug, article),
    )
    .map((article) =>
      withGuideArticleMedia(
        city,
        withGuideArticleTranslations(
          city,
          withArticleSummary(withArticleTable(city, article)),
        ),
      ),
    );

  return city.contentSource === "payload"
    ? normalizedArticles
    : normalizedArticles.map(withIrhalLegacyArticleUpdate);
};

export const getGuideArticle = (city: CityGuide, sectionSlug: string, slug: string) =>
  getGuideArticlesForSection(city, sectionSlug).find((article) => article.slug === slug);

export const localizeGuideArticle = (
  article: GuideArticle,
  locale: "en" | "ar",
): GuideArticle => {
  if (locale === "en") return article;

  const translation = article.translations?.[locale] ?? {};
  const translatedBlocks = Array.isArray(translation.blocks)
    ? (translation.blocks as GuideBlock[])
    : undefined;
  const missingCopy =
    "المحتوى العربي لهذا المقال غير مكتمل في نظام إدارة المحتوى.";
  const title = asArabicText(
    translation.title,
    "مقال قيد الترجمة",
  );
  const summary = asArabicText(translation.summary, missingCopy);

  return {
    ...article,
    blocks:
      translatedBlocks && translatedBlocks.length > 0
        ? translatedBlocks
        : [{ type: "paragraph", style: "Normal", text: missingCopy, links: [] }],
    summary,
    title,
  };
};
