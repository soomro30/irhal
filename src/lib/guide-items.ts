import type { CityGuide, GuideBlock, GuideTableBlock } from "./city-data";
import {
  getCanonicalNeighborhoodSlugForArea,
  getGuideSection,
  getGuideTable,
} from "./city-data";
import karachiAr from "../data/karachi-ar.json";
import karachiIrhalLegacyArticleUpdates from "../data/karachi-irhal-legacy-article-updates.json";
import karachiIrhalLegacyUpdates from "../data/karachi-irhal-legacy-updates.json";
import karachiOriginalContent from "../data/karachi-original-content.json";

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
  geoStatus: "provider-enrichment-required" | "verified";
};

export type GuideSectionCard = {
  title: string;
  slug: string;
  summary: string;
  icon: "award" | "calendar" | "book" | "train" | "building" | "map" | "wallet" | "family" | "shield";
};

export type GuideArticle = {
  citySlug: string;
  sectionSlug: string;
  title: string;
  slug: string;
  summary: string;
  blocks: GuideBlock[];
};

type IrhalLegacyUpdate = {
  kind: GuideItemKind;
  slug: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceModifiedAt: string;
  editorialUpdate: string;
  verificationNote: string;
  sourceAddress?: string;
  sourceLocation?: string;
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

const imageByKind: Record<GuideItemKind, string> = {
  place: "/images/karachi-guide/place.svg",
  hotel: "/images/karachi-guide/hotel.svg",
  restaurant: "/images/karachi-guide/restaurant.svg",
  masjid: "/images/karachi-guide/masjid.svg",
  shopping: "/images/karachi-guide/shopping.svg",
  tour: "/images/karachi-guide/tour.svg",
  family: "/images/karachi-guide/family.svg",
  festival: "/images/karachi-guide/festival.svg",
};

const irhalLegacyUpdateByKey = new Map(
  (karachiIrhalLegacyUpdates as IrhalLegacyUpdate[]).map((update) => [
    `${update.kind}:${update.slug}`,
    update,
  ]),
);

type OriginalContentEntry = {
  paragraphs?: string[];
  location?: string;
};

const originalContentByKey = karachiOriginalContent as Record<
  string,
  OriginalContentEntry
>;

const withOriginalContent = (item: GuideItem): GuideItem => {
  const entry = originalContentByKey[`${item.kind}:${item.slug}`];
  if (!entry) return item;

  const paragraphs = (entry.paragraphs ?? []).filter((p) => p.trim());
  const location = entry.location?.trim();

  return {
    ...item,
    originalContent: paragraphs.length > 0 ? paragraphs : undefined,
    originalLocation: location || undefined,
  };
};

// Prefer Payload-managed editorial fields/media when the matching guide-item
// document has them. The imported guide tables remain the fallback.
const withCmsGuideItem = (city: CityGuide, item: GuideItem): GuideItem => {
  const key = `${item.kind}:${item.slug}`;
  const override =
    city.guideItemOverrides?.[key] ?? city.guideItemOverrides?.[item.slug];
  const url =
    city.guideItemImages?.[key] ??
    city.guideItemImages?.[item.slug];
  const gallery =
    city.guideItemGalleries?.[key] ??
    city.guideItemGalleries?.[item.slug];
  if (!override && !url && !gallery) return item;

  return {
    ...item,
    ...(override?.title ? { title: override.title } : {}),
    ...(override?.area ? { area: override.area } : {}),
    ...(override?.category ? { category: override.category } : {}),
    ...(override?.description ? { description: override.description } : {}),
    ...(override?.budget ? { budget: override.budget } : {}),
    ...(override?.mapUrl ? { mapUrl: override.mapUrl } : {}),
    ...(override?.imageAlt ? { imageAlt: override.imageAlt } : {}),
    ...(override?.originalContent && override.originalContent.length > 0
      ? { originalContent: override.originalContent }
      : {}),
    ...(override?.geoStatus ? { geoStatus: override.geoStatus } : {}),
    ...(url ? { cmsImageUrl: url } : {}),
    ...(gallery && gallery.length > 0 ? { galleryUrls: gallery } : {}),
  };
};

const withNeighborhood = (city: CityGuide, item: GuideItem): GuideItem => {
  const key = `${item.kind}:${item.slug}`;
  const neighborhoodSlug =
    city.guideItemNeighborhoods?.[key] ??
    city.guideItemNeighborhoods?.[item.slug] ??
    getCanonicalNeighborhoodSlugForArea(city, item.area);

  return neighborhoodSlug ? { ...item, neighborhoodSlug } : item;
};

const irhalLegacyArticleUpdateByKey = (
  karachiIrhalLegacyArticleUpdates as IrhalLegacyArticleUpdate[]
).reduce<Map<string, IrhalLegacyArticleUpdate[]>>((updatesByKey, update) => {
  const key = `${update.sectionSlug}:${update.articleSlug}`;
  updatesByKey.set(key, [...(updatesByKey.get(key) ?? []), update]);
  return updatesByKey;
}, new Map());

const withIrhalLegacyUpdate = (item: GuideItem): GuideItem => {
  const update = irhalLegacyUpdateByKey.get(`${item.kind}:${item.slug}`);
  if (!update) return item;

  return {
    ...item,
    details: {
      ...item.details,
      original_in_house_summary: item.description,
      legacy_irhal_editorial_update: update.editorialUpdate,
      legacy_irhal_verification_note: update.verificationNote,
      legacy_irhal_source_title: update.sourceTitle,
      legacy_irhal_source_url: update.sourceUrl,
      legacy_irhal_source_modified_at: update.sourceModifiedAt,
      legacy_irhal_verified_at: "2026-05-29",
      legacy_irhal_source_type: "editorial",
      legacy_irhal_confidence: "medium",
      ...(update.sourceAddress
        ? { legacy_irhal_source_address: update.sourceAddress }
        : {}),
      ...(update.sourceLocation
        ? { legacy_irhal_source_location: update.sourceLocation }
        : {}),
    },
  };
};

const withIrhalLegacyArticleUpdate = (article: GuideArticle): GuideArticle => {
  return article;
};

export const getIrhalLegacyArticleUpdate = (
  sectionSlug: string,
  articleSlug: string,
) => irhalLegacyArticleUpdateByKey.get(`${sectionSlug}:${articleSlug}`) ?? [];

export const sectionCards: GuideSectionCard[] = [
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
    title: "Itineraries",
    slug: "city-in-a-day-and-longer-itineraries",
    summary: "One-day, two-day, three-day, old-city, and beach clusters.",
    icon: "calendar",
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

export const slugifyGuideItem = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const getMapUrl = (row: GuideTableBlock["rows"][number]) => {
  const possibleKeys = ["map", "map_search"];
  for (const key of possibleKeys) {
    const link = row.links[key]?.[0]?.url;
    if (link) return link;
  }
  return undefined;
};

const asItem = ({
  city,
  table,
  row,
  index,
  kind,
  sectionSlug,
  titleKey,
  areaKey,
  categoryKey,
  descriptionKey,
  budgetKey,
}: {
  city: CityGuide;
  table: GuideTableBlock;
  row: GuideTableBlock["rows"][number];
  index: number;
  kind: GuideItemKind;
  sectionSlug: string;
  titleKey: string;
  areaKey: string;
  categoryKey: string;
  descriptionKey: string;
  budgetKey?: string;
}): GuideItem => {
  const title = row.values[titleKey] || "Untitled";
  const area = row.values[areaKey] || city.name;
  const category = row.values[categoryKey] || kind;
  const description = row.values[descriptionKey] || `${title} in ${area}.`;
  const mapUrl = getMapUrl(row);

  return {
    id: `${table.purpose}-${index}`,
    citySlug: city.slug,
    kind,
    sectionSlug,
    sourceTable: table.purpose,
    title,
    slug: slugifyGuideItem(title),
    eyebrow: `${kind.replace("-", " ")} in ${area}`,
    area,
    category,
    description,
    budget: budgetKey ? row.values[budgetKey] : undefined,
    mapUrl,
    imageUrl: imageByKind[kind],
    imageAlt: `${title} ${kind} in ${city.name}`,
    details: row.values,
    geoStatus: "provider-enrichment-required",
  };
};

const asLocalizedText = (
  value: unknown,
  fallback: string,
) => (typeof value === "string" && value.trim() ? value : fallback);

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

const localizeAreaFallback = (area: string) =>
  arabicAreaLabel[area.toLowerCase()] ?? area;

const localArItems = (karachiAr as { items?: Record<string, Record<string, unknown>> })
  .items ?? {};
const localArArticles =
  (
    karachiAr as {
      articles?: Record<string, Record<string, Record<string, unknown>>>;
    }
  ).articles ?? {};

const withTranslations = (city: CityGuide, item: GuideItem): GuideItem => {
  const cmsTranslations =
    city.guideItemTranslations?.[`${item.kind}:${item.slug}`] ??
    city.guideItemTranslations?.[item.slug];

  // Local editorial Arabic (repo-managed); CMS translations take precedence.
  const localAr = localArItems[`${item.kind}:${item.slug}`];
  const arEntry =
    localAr || cmsTranslations?.ar
      ? { ar: { ...(localAr ?? {}), ...(cmsTranslations?.ar ?? {}) } }
      : undefined;

  const translations =
    cmsTranslations || arEntry
      ? { ...(cmsTranslations ?? {}), ...(arEntry ?? {}) }
      : undefined;

  return translations ? { ...item, translations } : item;
};

export const localizeGuideItem = (
  item: GuideItem,
  locale: "en" | "ar",
): GuideItem => {
  if (locale === "en") return item;

  const translation = item.translations?.[locale];
  if (!translation) {
    return {
      ...item,
      eyebrow: `${arabicKindLabel[item.kind]} في ${localizeAreaFallback(item.area)}`,
    };
  }

  const title = asLocalizedText(translation.title ?? translation.name, item.title);
  const area = asLocalizedText(translation.area, item.area);
  const category = asLocalizedText(translation.category, item.category);
  const overview =
    asLocalizedParagraphs(translation.overview) ??
    asLocalizedParagraphs(translation.body);
  const address = asLocalizedText(translation.address, "");

  return {
    ...item,
    area,
    category,
    description: asLocalizedText(
      translation.summary ?? translation.description,
      item.description,
    ),
    eyebrow: asLocalizedText(translation.eyebrow, `${category} في ${area}`),
    imageAlt: asLocalizedText(translation.imageAlt, item.imageAlt),
    title,
    // Localize the long-form overview/address too, so cards and detail pages
    // show translated content instead of the English original.
    ...(overview && overview.length > 0 ? { originalContent: overview } : {}),
    ...(address ? { originalLocation: address } : {}),
  };
};

export const getGuideItems = (city: CityGuide): GuideItem[] => {
  if (city.guideItems && city.guideItems.length > 0) {
    return city.guideItems.map((item) => withTranslations(city, item));
  }

  const configs = [
    {
      purpose: "festivals",
      kind: "festival" as const,
      sectionSlug: "festivals-and-annual-events",
      titleKey: "festival_season",
      areaKey: "month",
      categoryKey: "month",
      descriptionKey: "what_it_means_for_visitors",
    },
    {
      purpose: "places_to_visit",
      kind: "place" as const,
      sectionSlug: "places-to-visit",
      titleKey: "place",
      areaKey: "area",
      categoryKey: "type",
      descriptionKey: "why_it_matters_editorial_note",
    },
    {
      purpose: "hotels",
      kind: "hotel" as const,
      sectionSlug: "hotels",
      titleKey: "hotel_stay",
      areaKey: "area",
      categoryKey: "tier",
      descriptionKey: "guide_note",
    },
    {
      purpose: "food_restaurants",
      kind: "restaurant" as const,
      sectionSlug: "food-and-restaurants",
      titleKey: "restaurant_food_area",
      areaKey: "area",
      categoryKey: "cuisine_type",
      descriptionKey: "what_to_order_why_go",
      budgetKey: "budget",
    },
    {
      purpose: "masjids",
      kind: "masjid" as const,
      sectionSlug: "muslim-visitor-information",
      titleKey: "masjid",
      areaKey: "area",
      categoryKey: "type",
      descriptionKey: "guide_note",
    },
    {
      purpose: "shopping",
      kind: "shopping" as const,
      sectionSlug: "shopping",
      titleKey: "shopping_area_store",
      areaKey: "area",
      categoryKey: "class",
      descriptionKey: "description",
    },
    {
      purpose: "organized_tours",
      kind: "tour" as const,
      sectionSlug: "organized-tours",
      titleKey: "tour_type",
      areaKey: "sites_experience",
      categoryKey: "tour_type",
      descriptionKey: "guide_note",
    },
    {
      purpose: "children_in_tow",
      kind: "family" as const,
      sectionSlug: "children-in-tow",
      titleKey: "child_friendly_place",
      areaKey: "child_friendly_place",
      categoryKey: "child_friendly_place",
      descriptionKey: "why_go_caution",
    },
  ];

  return configs.flatMap((config) => {
    const table = getGuideTable(city, config.purpose);
    if (!table) return [];

    return table.rows.map((row, index) => {
      const baseItem = asItem({
        city,
        table,
        row,
        index,
        kind: config.kind,
        sectionSlug: config.sectionSlug,
        titleKey: config.titleKey,
        areaKey: config.areaKey,
        categoryKey: config.categoryKey,
        descriptionKey: config.descriptionKey,
        budgetKey: "budgetKey" in config ? config.budgetKey : undefined,
      });

      return withTranslations(
        city,
        withNeighborhood(
          city,
          withCmsGuideItem(
            city,
            withOriginalContent(withIrhalLegacyUpdate(baseItem)),
          ),
        ),
      );
    });
  });
};

export const getGuideItemsForSection = (city: CityGuide, sectionSlug: string) =>
  getGuideItems(city).filter((item) => item.sectionSlug === sectionSlug);

export const getGuideItemsByKind = (city: CityGuide, kind: GuideItemKind) =>
  getGuideItems(city).filter((item) => item.kind === kind);

export const getGuideItem = (city: CityGuide, kind: GuideItemKind, slug: string) =>
  getGuideItemsByKind(city, kind).find((item) => item.slug === slug);

export const pathForGuideItem = (city: CityGuide, item: GuideItem) => {
  if (item.kind === "family") return `/city/${city.slug}/family/${item.slug}`;
  return `/city/${city.slug}/${item.kind}/${item.slug}`;
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

const arabicArticleFallback: Record<
  string,
  { summary?: string; title: string }
> = {
  "health-and-safety:useful-emergency-numbers": {
    summary: "أرقام الطوارئ والخدمات الأساسية التي يحتاجها المسافر في كراتشي.",
    title: "أرقام الطوارئ المفيدة",
  },
  "visitor-information:fast-facts": {
    summary: "حقائق سريعة عن الموقع، الاتصال، الطوارئ، السكان، اللغة، التوقيت، والعملة.",
    title: "حقائق سريعة",
  },
  "visitor-information:annual-temperature-and-climate-guide": {
    summary: "درجات الحرارة الشهرية وإرشادات التخطيط للطقس في كراتشي على مدار العام.",
    title: "دليل درجات الحرارة والمناخ السنوي",
  },
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
        };
      }
      current.blocks.push(block);
      continue;
    }

    if (block.style === "Heading 2" || block.style === "Heading 3") {
      const headingSlug = slugifyGuideItem(block.text);
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
        blocks: [],
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
      };
    }

    if (!current.summary && block.text) {
      current.summary = block.text;
    }
    current.blocks.push(block);
  }

  if (current) articles.push(current);
  return articles
    .filter((article) => article.summary || article.blocks.length > 0)
    .map((article) => withArticleSummary(withArticleTable(city, article)))
    .map(withIrhalLegacyArticleUpdate);
};

export const getGuideArticle = (city: CityGuide, sectionSlug: string, slug: string) =>
  getGuideArticlesForSection(city, sectionSlug).find((article) => article.slug === slug);

export const localizeGuideArticle = (
  article: GuideArticle,
  locale: "en" | "ar",
): GuideArticle => {
  if (locale === "en") return article;

  const translation = localArArticles[article.sectionSlug]?.[article.slug];
  const fallback = arabicArticleFallback[`${article.sectionSlug}:${article.slug}`];
  if (!translation && !fallback) return article;

  const translatedParagraphs = Array.isArray(translation?.blocks)
    ? (translation.blocks as GuideBlock[]).filter(
        (block): block is GuideBlock & { type: "paragraph" } =>
          block.type === "paragraph",
      )
    : [];
  let translatedParagraphIndex = 0;
  const blocks =
    translatedParagraphs.length > 0
      ? article.blocks.map((block) => {
          if (block.type === "table") return block;

          const translated = translatedParagraphs[translatedParagraphIndex];
          translatedParagraphIndex += 1;

          return translated
            ? {
                ...block,
                links: translated.links ?? block.links,
                style: translated.style ?? block.style,
                text: asLocalizedText(translated.text, block.text),
              }
            : block;
        })
      : article.blocks;

  return {
    ...article,
    blocks,
    summary: asLocalizedText(
      translation?.summary ?? fallback?.summary,
      article.summary,
    ),
    title: asLocalizedText(translation?.title ?? fallback?.title, article.title),
  };
};
