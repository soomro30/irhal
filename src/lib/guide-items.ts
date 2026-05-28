import type { CityGuide, GuideBlock, GuideTableBlock } from "./city-data";
import { getGuideSection, getGuideTable } from "./city-data";

export type GuideItemKind = "place" | "hotel" | "restaurant" | "masjid" | "shopping" | "tour" | "family" | "festival";

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
  category: string;
  description: string;
  budget?: string;
  mapUrl?: string;
  imageUrl: string;
  imageAlt: string;
  details: Record<string, string>;
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
    summary: "Month-by-month Karachi event watchlist with publishing verification notes.",
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
    summary: "Karachi today, Karachi back then, residents, culture, and editorial voice.",
    icon: "building",
  },
  {
    title: "Best Neighborhoods",
    slug: "neighborhood-operating-guide",
    summary: "The operating backbone for hotels, restaurants, masjids, maps, and itineraries.",
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
    summary: "Attractions and landmarks as separate discoverable pages, not a flat article.",
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
    imageAlt: `${title} ${kind} image placeholder for CMS media upload`,
    details: row.values,
    geoStatus: "provider-enrichment-required",
  };
};

export const getGuideItems = (city: CityGuide): GuideItem[] => {
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

    return table.rows.map((row, index) =>
      asItem({
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
      }),
    );
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

export const getGuideArticlesForSection = (city: CityGuide, sectionSlug: string): GuideArticle[] => {
  const section = getGuideSection(city, sectionSlug);
  if (!section) return [];

  const articles: GuideArticle[] = [];
  let current: GuideArticle | null = null;

  for (const block of section.blocks) {
    if (block.type === "table") continue;

    if (block.style === "Heading 2" || block.style === "Heading 3") {
      if (current) articles.push(current);
      current = {
        citySlug: city.slug,
        sectionSlug,
        title: block.text,
        slug: slugifyGuideItem(block.text),
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
  return articles.filter((article) => article.summary || article.blocks.length > 0);
};

export const getGuideArticle = (city: CityGuide, sectionSlug: string, slug: string) =>
  getGuideArticlesForSection(city, sectionSlug).find((article) => article.slug === slug);
