import karachiGuideJson from "../data/karachi-guide.json";
import karachiNeighborhoodArJson from "../data/karachi-neighborhood-ar.json";
import karachiNeighborhoodCoordinatesJson from "../data/karachi-neighborhood-coordinates.json";

export type ListingType =
  | "place"
  | "hotel"
  | "restaurant"
  | "masjid"
  | "shopping"
  | "tour"
  | "islamic-landmark"
  | "prayer-area";

export type MapQuery = {
  label: string;
  query: string;
  providerUrl: string;
};

export type Neighborhood = {
  slug: string;
  name: string;
  district: string;
  zone: string;
  clusterType: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  operatingGuide: string;
  bestFor: string[];
  liveMapQueries: MapQuery[];
  translations?: LocaleTranslations;
};

export type Listing = {
  slug: string;
  name: string;
  listingType: ListingType;
  neighborhoodSlug: string;
  address: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  shortDescription: string;
  priceRange?: string;
  website?: string;
  phone?: string;
  affiliateUrl?: string;
  muslimTravel?: {
    isHalal?: boolean;
    halalCertification?: string;
    womenPrayerArea?: boolean;
    familyFriendly?: boolean;
    notes?: string;
  };
  seo: {
    title: string;
    description: string;
    schemaType: string;
  };
  lastVerifiedAt: string;
};

export const pathForListing = (city: Pick<CityGuide, "slug">, listing: Listing) => {
  if (listing.listingType === "islamic-landmark") {
    return `/city/${city.slug}/place/${listing.slug}`;
  }

  if (listing.listingType === "prayer-area") {
    return `/city/${city.slug}/islamic-travel`;
  }

  return `/city/${city.slug}/${listing.listingType}/${listing.slug}`;
};

export type Itinerary = {
  slug: string;
  title: string;
  durationDays: number;
  audience: string;
  summary: string;
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
  days: {
    dayNumber: number;
    theme: string;
    description?: string;
    start?: string;
    transport?: string;
    breakfast?: string;
    lunch?: string;
    dinner?: string;
    pacing?: string;
    stops: string[];
    routeNotes: string;
  }[];
};

export type GuideParagraphBlock = {
  type: "paragraph";
  style: string;
  text: string;
  links: { text: string; url: string }[];
};

export type GuideTableBlock = {
  type: "table";
  index: number;
  purpose: string;
  headers: string[];
  rows: {
    values: Record<string, string>;
    links: Record<string, { text: string; url: string }[]>;
  }[];
};

export type GuideBlock = GuideParagraphBlock | GuideTableBlock;

export type GuideSection = {
  title: string;
  slug: string;
  summary?: string;
  blocks: GuideBlock[];
  translations?: LocaleTranslations;
};

export type LocaleTranslations = Record<string, Record<string, unknown>>;

export type CityGuideImport = {
  source: {
    fileName: string;
    extractedAt: string;
    formatVersion: string;
  };
  city: {
    name: string;
    slug: string;
    country: string;
    region: string;
    updatedLabel: string;
  };
  introBlocks: GuideBlock[];
  sections: GuideSection[];
  tables: GuideTableBlock[];
  coverage: {
    sectionCount: number;
    tableCount: number;
    requiredSectionSlugs: string[];
    missingRequiredSectionSlugs: string[];
    tableRowCounts: Record<string, number>;
  };
};

export type CityGuideItem = {
  id: string;
  citySlug: string;
  kind:
    | "place"
    | "hotel"
    | "restaurant"
    | "masjid"
    | "shopping"
    | "tour"
    | "family"
    | "festival";
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

export type CityGuide = {
  contentSource?: "payload" | "local";
  slug: string;
  name: string;
  country: string;
  region: string;
  locale: string;
  lede: string;
  heroImageUrl?: string;
  heroImageUrls?: string[];
  timezone: string;
  currency: string;
  languages: string[];
  latitude: number;
  longitude: number;
  mapUrl: string;
  lastVerifiedAt: string;
  translations?: LocaleTranslations;
  guideItemTranslations?: Record<string, LocaleTranslations>;
  guideArticleTranslations?: Record<string, LocaleTranslations>;
  guideItemOverrides?: Record<
    string,
    {
      area?: string;
      budget?: string;
      category?: string;
      description?: string;
      geoStatus?: "provider-enrichment-required" | "verified";
      imageAlt?: string;
      mapUrl?: string;
      originalContent?: string[];
      title?: string;
    }
  >;
  guideItemImages?: Record<string, string>;
  guideItemGalleries?: Record<string, string[]>;
  guideItemNeighborhoods?: Record<string, string>;
  guideItems?: CityGuideItem[];
  fastFacts: { label: string; value: string }[];
  sections: {
    visitorInformation: string;
    climateWhenToGo: string;
    transportSystem: string;
    festivalsEvents: string;
    healthSafety: string;
    muslimTravel: string;
  };
  neighborhoods: Neighborhood[];
  listings: Listing[];
  itineraries: Itinerary[];
  seo: {
    title: string;
    description: string;
    canonicalPath: string;
    schemaType: string;
  };
  fullGuide: CityGuideImport;
};

const googleMaps = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const karachiGuide = karachiGuideJson as CityGuideImport;
const publicR2Url = process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "");
const mediaFallback = (filename: string, fallback: string) =>
  publicR2Url ? `${publicR2Url}/media/${filename}` : fallback;
const karachiNeighborhoodCoordinates = karachiNeighborhoodCoordinatesJson as Record<
  string,
  {
    confidence: string;
    latitude: number;
    longitude: number;
    source: string;
  }
>;
const karachiNeighborhoodAr = karachiNeighborhoodArJson as Record<
  string,
  { description: string; name: string }
>;

const slugifyNeighborhood = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

const zoneForDistrict = (districtZone: string) => {
  const normalized = districtZone.toLowerCase();

  if (normalized.includes("malir")) return "airport";
  if (normalized.includes("west")) return "west";
  if (normalized.includes("central")) return "central";
  if (normalized.includes("east")) return "east";
  if (normalized.includes("greater")) return "suburban";
  return "south";
};

const clusterTypeForNeighborhood = (values: Record<string, string>) => {
  const haystack = [
    values.area,
    values.character,
    values.best_for,
  ].join(" ").toLowerCase();

  if (/(beach|coast|sea|waterfront|harbou?r|port|manora|keamari|seaview|sandspit|hawksbay|mubarak|cape monze)/.test(haystack)) {
    return "waterfront";
  }
  if (/(airport|cantonment|malir|model colony)/.test(haystack)) {
    return "airport";
  }
  if (/(masjid|mosque|shrine|religious|jamia)/.test(haystack)) {
    return "religious";
  }
  if (/(food|restaurant|cafe|chai|nihari|biryani|haleem|rabri|dessert|bbq|snack)/.test(haystack)) {
    return "food";
  }
  if (/(market|bazaar|shopping|retail|mall|commercial|electronics|cloth|fabric|jewellery|wholesale)/.test(haystack)) {
    return "shopping";
  }
  if (/(family|zoo|park|theme|kids|children|picnic|open space|universit)/.test(haystack)) {
    return "family";
  }
  if (/(historic|heritage|colonial|old city|old neighborhoods|museum|architecture)/.test(haystack)) {
    return "historic";
  }
  if (/(business|office|industrial|corporate|civic|artery|road|hospital)/.test(haystack)) {
    return "business";
  }
  return "mixed";
};

const splitBestFor = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildNeighborhoodsFromOperatingGuide = (
  guide: CityGuideImport,
): Neighborhood[] => {
  const table = guide.tables.find(
    (item) => item.purpose === "neighborhood_operating_guide",
  );

  if (!table) return [];

  return table.rows.map((row) => {
    const values = row.values;
    const area = values.area;
    const slug = slugifyNeighborhood(area);
    const coordinates = karachiNeighborhoodCoordinates[slug];

    if (!coordinates) {
      throw new Error(`Missing Karachi neighborhood coordinates for ${area}`);
    }

    return {
      slug,
      name: area,
      district: values.district_zone,
      zone: zoneForDistrict(values.district_zone),
      clusterType: clusterTypeForNeighborhood(values),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      mapUrl: row.links.map?.[0]?.url ?? googleMaps(`${area} Karachi Pakistan`),
      operatingGuide: `${area} is a ${values.character.toLowerCase()} area in Karachi. Best for ${values.best_for}.`,
      bestFor: splitBestFor(values.best_for),
      liveMapQueries: [
        {
          label: "Places nearby",
          query: `places to visit in ${area} Karachi`,
          providerUrl: googleMaps(`places to visit in ${area} Karachi`),
        },
        {
          label: "Restaurants nearby",
          query: `restaurants in ${area} Karachi`,
          providerUrl: googleMaps(`restaurants in ${area} Karachi`),
        },
        {
          label: "Masjids nearby",
          query: `masjids in ${area} Karachi`,
          providerUrl: googleMaps(`masjids in ${area} Karachi`),
        },
      ],
      ...(karachiNeighborhoodAr[slug]
        ? {
            translations: {
              ar: {
                description: karachiNeighborhoodAr[slug].description,
                name: karachiNeighborhoodAr[slug].name,
                operatingGuide: karachiNeighborhoodAr[slug].description,
              },
            },
          }
        : {}),
    };
  });
};

const karachiNeighborhoods = buildNeighborhoodsFromOperatingGuide(karachiGuide);

export const cities: CityGuide[] = [
  {
    slug: "karachi",
    name: "Karachi",
    country: "Pakistan",
    region: "Sindh",
    locale: "en",
    lede: "Karachi is Pakistan's largest coastal city, a business capital, food powerhouse, and layered urban gateway where historic quarters, beach districts, shopping corridors, masjids, and family-friendly attractions need neighborhood-led navigation.",
    heroImageUrl: mediaFallback(
      "karachi-hero-mohatta-palace.webp",
      "/images/karachi-guide/place-mohatta-palace.jpg",
    ),
    heroImageUrls: [
      mediaFallback(
        "karachi-hero-mohatta-palace.webp",
        "/images/karachi-guide/place-mohatta-palace.jpg",
      ),
      "/images/karachi-guide/karachi-coast-hero.png",
      "/images/karachi-guide/place-mazar-e-quaid.jpg",
      "/images/karachi-guide/place-frere-hall.jpg",
    ],
    timezone: "Asia/Karachi",
    currency: "PKR",
    languages: ["Urdu", "English", "Sindhi"],
    latitude: 24.8607,
    longitude: 67.0011,
    mapUrl: googleMaps("Karachi Pakistan"),
    lastVerifiedAt: "2026-05-26",
    fastFacts: [
      {
        label: "Best first base",
        value: "Clifton or DHA for sea-facing access and restaurants",
      },
      { label: "Airport", value: "Jinnah International Airport" },
      {
        label: "Visitor rhythm",
        value: "Plan by neighborhood because cross-city travel can be slow",
      },
      {
        label: "Muslim travel",
        value:
          "Masjids are widespread; confirm women prayer facilities before visiting",
      },
    ],
    sections: {
      visitorInformation:
        "Visitors should plan transport ahead, keep neighborhood clusters tight, and use verified map pins for hotels, restaurants, masjids, and attractions. Cash remains useful, while cards are common in premium districts.",
      climateWhenToGo:
        "The most comfortable months are generally November to February. Summers are hot and humid, while the sea breeze makes coastal evenings more pleasant.",
      transportSystem:
        "Ride-hailing, private cars, taxis, and planned neighborhood clusters are the practical first layer. Airport transfers should be booked before arrival.",
      festivalsEvents:
        "Karachi's calendar includes Eid travel periods, Ramadan food markets, literature and arts events, exhibitions, and seasonal beach activity.",
      healthSafety:
        "Use known transport providers, keep valuables discreet, confirm food hygiene, and follow local guidance for beach conditions and late-night movement.",
      muslimTravel:
        "Karachi is deeply mosque-served and halal-friendly, but the platform records women prayer areas, certification notes, and family suitability at listing level rather than assuming every venue has the same facilities.",
    },
    neighborhoods: karachiNeighborhoods,
    listings: [
      {
        slug: "mohatta-palace",
        name: "Mohatta Palace Museum",
        listingType: "place",
        neighborhoodSlug: "clifton",
        address: "7 Hatim Alvi Road, Clifton, Karachi",
        latitude: 24.8146,
        longitude: 67.0327,
        mapUrl: googleMaps("Mohatta Palace Museum Karachi"),
        shortDescription:
          "A heritage palace and museum anchor for Clifton, useful for culture-led itineraries and nearby beach or shopping clusters.",
        seo: {
          title: "Mohatta Palace Museum Karachi",
          description:
            "Map-first visitor guide to Mohatta Palace Museum in Clifton, Karachi.",
          schemaType: "TouristAttraction",
        },
        lastVerifiedAt: "2026-05-26",
      },
      {
        slug: "quaid-e-azam-mausoleum",
        name: "Mazar-e-Quaid",
        listingType: "islamic-landmark",
        neighborhoodSlug: "saddar",
        address: "M. A. Jinnah Road, Karachi",
        latitude: 24.8754,
        longitude: 67.0408,
        mapUrl: googleMaps("Mazar-e-Quaid Karachi"),
        shortDescription:
          "The mausoleum of Pakistan's founder and one of Karachi's most important civic landmarks.",
        muslimTravel: {
          familyFriendly: true,
          notes: "Respectful dress and behavior are expected.",
        },
        seo: {
          title: "Mazar-e-Quaid Karachi Islamic Landmark",
          description: "Visitor and map guide to Mazar-e-Quaid in Karachi.",
          schemaType: "TouristAttraction",
        },
        lastVerifiedAt: "2026-05-26",
      },
      {
        slug: "bbq-tonight-clifton",
        name: "BBQ Tonight Clifton",
        listingType: "restaurant",
        neighborhoodSlug: "clifton",
        address: "Clifton, Karachi",
        latitude: 24.8159,
        longitude: 67.0263,
        mapUrl: googleMaps("BBQ Tonight Clifton Karachi"),
        priceRange: "$$",
        shortDescription:
          "A well-known Karachi restaurant anchor for Pakistani grills, family dining, and Clifton food planning.",
        muslimTravel: {
          isHalal: true,
          familyFriendly: true,
          notes: "Confirm halal details and current opening hours before visiting.",
        },
        seo: {
          title: "BBQ Tonight Clifton Karachi Restaurant",
          description:
            "Restaurant listing for BBQ Tonight Clifton with halal and family travel attributes.",
          schemaType: "Restaurant",
        },
        lastVerifiedAt: "2026-05-26",
      },
      {
        slug: "movenpick-hotel-karachi",
        name: "Movenpick Hotel Karachi",
        listingType: "hotel",
        neighborhoodSlug: "saddar",
        address: "Club Road, Karachi",
        latitude: 24.8473,
        longitude: 67.0327,
        mapUrl: googleMaps("Movenpick Hotel Karachi"),
        priceRange: "$$$",
        shortDescription:
          "A central upper-tier hotel option for business travelers and visitors who need access to the historic core.",
        muslimTravel: { familyFriendly: true },
        seo: {
          title: "Movenpick Hotel Karachi",
          description:
            "Hotel listing with map, neighborhood context, and travel planning notes.",
          schemaType: "Hotel",
        },
        lastVerifiedAt: "2026-05-26",
      },
    ],
    itineraries: [
      {
        slug: "karachi-in-a-day",
        title: "Karachi In A Day",
        durationDays: 1,
        audience: "first-time",
        summary:
          "A full first-time Karachi day that starts with the national mausoleum, moves through civic heritage and Burns Road food, then finishes around Clifton, the shrine, Sea View, and a coastal dinner.",
        intro:
          "This is a high-energy one-day plan for travelers who want the city headline in a single sweep. Keep the day private-car based, start early, and treat the afternoon shift from the historic center to Clifton as the main traffic buffer.",
        planning: {
          stay:
            "Best base: Civil Lines, Saddar, Clifton, or DHA. Civil Lines/Saddar keeps the morning short; Clifton/DHA makes the evening easier after Sea View and dinner.",
          transport:
            "Use one private car with driver or ride-hailing for the full day. Walking works only inside individual stops; the route itself is not walkable.",
          meals: {
            breakfast:
              "Eat breakfast at the hotel before leaving so you can reach Mazar-e-Quaid soon after opening.",
            lunch:
              "Plan a late lunch or snack stop around Burns Road, then keep the next leg light because Clifton traffic can be slow.",
            dinner:
              "End with a reserved table around Do Darya or Clifton/DHA after sunset.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Founder landmarks, colonial heritage, food, and the coast",
            description:
              "Begin with national and civic landmarks while the city is cooler, keep the middle of the day flexible for museum timings, then let the evening become a calmer coastal route with prayer, beach, and dinner stops.",
            start:
              "Leave the hotel by 8:00 AM, carrying water, modest layers for shrine or masjid visits, and a printed or saved route.",
            transport:
              "Keep the same driver from morning to dinner and ask them to wait at each stop instead of searching for new cars in crowded areas.",
            breakfast:
              "Hotel breakfast before departure, or a simple cafe stop near your base if you are staying in Clifton or DHA.",
            lunch:
              "Burns Road for classic Karachi food; keep the stop early enough to avoid turning the afternoon into a traffic rush.",
            dinner:
              "Do Darya for the coast-facing finale, with Clifton or DHA as easier backup areas if traffic or weather changes.",
            pacing:
              "This is a full day. Skip one museum or shorten Burns Road if children, elders, heat, or traffic start to slow the route.",
            stops: [
              "mazar-e-quaid",
              "frere-hall",
              "national-museum-of-pakistan",
              "burns-road-food-street",
              "mohatta-palace-museum",
              "abdullah-shah-ghazi-shrine",
              "clifton-beach-sea-view",
              "do-darya",
            ],
            routeNotes:
              "Start early at Mazar-e-Quaid before the heat, keep the heritage stops close around Saddar and Civil Lines, then move to Clifton for the museum, shrine, beach sunset, and dinner.",
          },
        ],
      },
      {
        slug: "karachi-two-day-classic",
        title: "Karachi Two-Day Classic",
        durationDays: 2,
        audience: "first-time",
        summary:
          "A balanced two-day route for visitors who want Karachi's history, museums, old food districts, Clifton culture, shopping, and a calmer second-day pace.",
        intro:
          "This is the most comfortable first Karachi itinerary: day one stays around the historic center and old food districts, while day two moves through museums, Clifton, the coast, and dinner. It works well for couples, families with older children, and first-time visitors who want a full city feel without compressing everything into one day.",
        planning: {
          stay:
            "Best base: Clifton, DHA, Civil Lines, or Saddar. Clifton/DHA is easier for evening dining and family comfort; Civil Lines/Saddar is better if your priority is old-city history.",
          transport:
            "Book a private car with driver for both days, or use ride-hailing for shorter hops with a dedicated driver for the old-city cluster. Avoid planning this as a walking itinerary.",
          meals: {
            breakfast:
              "Breakfast near the hotel both mornings. Keep it predictable so the sightseeing day starts on time.",
            lunch:
              "Use Burns Road or Saddar on day one, then a museum, mall, Boat Basin, or Clifton/DHA stop on day two depending on your route speed.",
            dinner:
              "Day one can finish near Burns Road or Clifton; day two should end at Do Darya, Boat Basin, or a reserved Clifton/DHA restaurant.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Core Karachi history and old-city food",
            description:
              "Make this the city-origin story: founding landmark, museum context, colonial commercial streets, historic masjid, then classic food. The day is richer with a local guide because the old-city stops are close in meaning but not always easy to navigate alone.",
            start:
              "Start by 8:30 AM at Mazar-e-Quaid or the National Museum, then move into Tower and M.A. Jinnah Road before late afternoon congestion builds.",
            transport:
              "Use a local driver or guide, keep parking decisions with them, and walk only short, visible stretches between nearby old-city points.",
            breakfast:
              "Have breakfast at your hotel before leaving; this is not the day to search for breakfast inside the old-city traffic pattern.",
            lunch:
              "Plan Burns Road as lunch, late lunch, or an early dinner depending on museum timings and crowd levels.",
            dinner:
              "If Burns Road becomes lunch, finish later around Clifton/DHA. If Burns Road becomes dinner, keep Frere Hall as a calmer late-afternoon stop first.",
            pacing:
              "Keep one optional stop in reserve. If Tower, Denso Hall, and Memon Masjid take longer than expected, skip the least important stop rather than rushing meals.",
            stops: [
              "mazar-e-quaid",
              "national-museum-of-pakistan",
              "merewether-clock-tower",
              "denso-hall",
              "memon-masjid",
              "burns-road-food-street",
              "frere-hall",
            ],
            routeNotes:
              "Keep this day central and guided where possible. Begin with major civic landmarks, then move carefully through the old-city heritage cluster before ending with Burns Road and Frere Hall.",
          },
          {
            dayNumber: 2,
            theme: "Museums, Clifton culture, shrine, mall, and dinner",
            description:
              "Use this as the smoother cultural day: family-friendly museums in the morning, then a clean westward shift to Clifton for Mohatta Palace, shopping, prayer-aware pauses, beach air, and a relaxed dinner.",
            start:
              "Start after breakfast around 9:30 AM with the Karsaz museum cluster, then move to Clifton after lunch or in the early afternoon.",
            transport:
              "Private car or ride-hailing works well. Keep the route one-directional from Karsaz toward Clifton to avoid doubling back.",
            breakfast:
              "Breakfast at the hotel or a nearby cafe before the museum block.",
            lunch:
              "Use a cafe, mall, or Clifton/Boat Basin stop between museums and Mohatta Palace.",
            dinner:
              "Reserve Do Darya for the final meal, or stay around Boat Basin/Clifton if the sea breeze, weather, or children make a shorter finish better.",
            pacing:
              "This day should feel calmer than day one. Use Dolmen Mall as an air-conditioned pause, not just a shopping stop.",
            stops: [
              "paf-museum",
              "pakistan-maritime-museum",
              "mohatta-palace-museum",
              "dolmen-mall-clifton",
              "abdullah-shah-ghazi-shrine",
              "clifton-beach-sea-view",
              "do-darya",
            ],
            routeNotes:
              "Use the morning for Karsaz museums, then shift west to Clifton for culture, shopping, prayer-aware pauses, beach time, and an easy coastal dinner.",
          },
        ],
      },
      {
        slug: "karachi-three-day-deep-dive",
        title: "Karachi Three-Day Deep Dive",
        durationDays: 3,
        audience: "first-time",
        summary:
          "A deeper Karachi plan for travelers who want the old city, Clifton and DHA, family-friendly museums, shopping, and a final day shaped around either beaches or a big family outing.",
        intro:
          "This three-day plan gives Karachi room to breathe. It separates the old city, Clifton/coast, and family or beach choices so each day has a clear mood instead of becoming one long traffic negotiation.",
        planning: {
          stay:
            "Best base: Clifton or DHA for comfort, restaurants, and the coastal days. Civil Lines is also practical if your group is strongly heritage-focused.",
          transport:
            "Use a dedicated car with driver for day one and any western-beach outing. Ride-hailing can work for Clifton/DHA evenings when the group is small.",
          meals: {
            breakfast:
              "Keep breakfasts close to the hotel. Save exploration energy for lunch and dinner neighborhoods.",
            lunch:
              "Match lunch to the day cluster: Burns Road/Saddar on day one, Clifton/Boat Basin on day two, and a packed or pre-booked option for beach outings.",
            dinner:
              "Use dinner as the soft landing each day: Burns Road or Clifton, then Do Darya/Boat Basin, then an easy restaurant near your base.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Historic core, markets, and classic food",
            description:
              "Spend the first day on Karachi's civic and old-port identity. This is the densest day, so it benefits from early movement, modest expectations around traffic, and a guide who understands where walking is practical.",
            start:
              "Leave by 8:30 AM and keep the morning for Mazar-e-Quaid, Tower, and M.A. Jinnah Road before crowds thicken.",
            transport:
              "Private car with local driver or guide. Keep bags minimal and avoid long unsupervised walks through market lanes.",
            breakfast:
              "Hotel breakfast before departure.",
            lunch:
              "Burns Road or a Saddar stop, timed according to how the old-city cluster is moving.",
            dinner:
              "Either stay with Burns Road as the main meal or move to a quieter Clifton/DHA dinner if the day has been heavy.",
            pacing:
              "Dense heritage day. Protect energy by dropping one stop if heat, crowding, or parking becomes difficult.",
            stops: [
              "mazar-e-quaid",
              "merewether-clock-tower",
              "denso-hall",
              "wazir-mansion",
              "memon-masjid",
              "burns-road-food-street",
              "frere-hall",
            ],
            routeNotes:
              "Treat this as the old-city day: start early, use a local driver or guide, keep valuables discreet, and allow traffic buffers between the central landmarks.",
          },
          {
            dayNumber: 2,
            theme: "Sea, culture, shrine, and Clifton/DHA dining",
            description:
              "Keep the second day around Clifton, DHA, and the coast. It should feel slower: architecture and museum time first, then shrine, mall or cafe pause, sunset beach, and dinner.",
            start:
              "Start mid-morning after breakfast so Mohatta Palace and Clifton stops do not feel rushed.",
            transport:
              "Ride-hailing or private car. Distances are shorter than day one, but traffic around beach and mall access still needs buffers.",
            breakfast:
              "Breakfast near the hotel, especially if you are staying in Clifton or DHA.",
            lunch:
              "Clifton cafe, Boat Basin, or Dolmen Mall depending on prayer time, children, and heat.",
            dinner:
              "Do Darya or Boat Basin, preferably with a reservation for families or larger groups.",
            pacing:
              "Use the mall or cafe stop as a planned reset before sunset rather than as an afterthought.",
            stops: [
              "mohatta-palace-museum",
              "abdullah-shah-ghazi-shrine",
              "dolmen-mall-clifton",
              "clifton-beach-sea-view",
              "boat-basin-food-street",
              "do-darya",
            ],
            routeNotes:
              "Keep the day around Clifton and DHA so the route feels relaxed. Build in a prayer or rest pause before sunset and dinner.",
          },
          {
            dayNumber: 3,
            theme: "Museums, family stops, or the western beaches",
            description:
              "Choose the day-three version that fits your group: an easier museum-and-family route inside the city, or a bigger western-beach outing that needs advance planning and daylight travel.",
            start:
              "For museums, start around 9:30 AM. For Hawksbay or Sandspit, leave earlier and confirm hut access, tides, and sea conditions first.",
            transport:
              "Private car is strongly recommended for the western beaches. For the in-city version, ride-hailing can work if you keep stops clustered.",
            breakfast:
              "Full breakfast at the hotel, especially before a beach day.",
            lunch:
              "Carry snacks and water for the beach version; for the city version, use a mall or family restaurant between activities.",
            dinner:
              "Keep dinner close to your hotel or in Clifton/DHA after a beach outing so the return does not become another long event.",
            pacing:
              "Do not combine every family stop with the western beaches. Pick one main route and let the last evening stay easy.",
            stops: [
              "paf-museum",
              "pakistan-maritime-museum",
              "tdf-magnifiscience-centre",
              "safari-park",
              "hawksbay-beach",
              "sandspit-beach",
            ],
            routeNotes:
              "Choose the Karsaz/Gulshan museum-and-family cluster for an easier day, or switch to Hawksbay and Sandspit with advance planning, daylight travel, and current sea-condition checks.",
          },
        ],
      },
      {
        slug: "karachi-family-weekend",
        title: "Karachi Family Weekend",
        durationDays: 2,
        audience: "family",
        summary:
          "A child-friendly Karachi weekend that avoids overloaded market walking and combines interactive museums, open-air pauses, malls, beaches, and easy family meals.",
        intro:
          "This weekend plan is built around children, elders, stroller breaks, prayer pauses, and heat management. It avoids forcing old-city walking into a family trip and gives you clear places to pause when the day needs to slow down.",
        planning: {
          stay:
            "Best base: Clifton or DHA for family restaurants, mall access, and a shorter evening return. Karsaz can work if museums are the priority.",
          transport:
            "Use a private car or reliable ride-hailing with enough room for bags, snacks, and tired children. Keep beach and Bahria Town decisions separate.",
          meals: {
            breakfast:
              "Breakfast at the hotel before leaving. Families should not start the day hungry and then negotiate Karachi traffic.",
            lunch:
              "Use Dolmen Mall, Boat Basin, or a museum-adjacent family restaurant as the controlled lunch stop.",
            dinner:
              "Choose Boat Basin, Clifton/DHA, or a reserved family restaurant rather than leaving dinner open-ended after beach time.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Hands-on learning, lawns, and Clifton comfort",
            description:
              "Start with interactive museums while children have energy, then shift toward Clifton for an air-conditioned break, a visible beach stretch, and an easy meal. The day is designed to keep exits simple if someone gets tired.",
            start:
              "Leave after a proper breakfast, around 9:00 AM, with water, hats, light snacks, and a change of clothes if beach activity is likely.",
            transport:
              "Private car or roomy ride-hailing. Keep one adult focused on bags and pickup points at each stop.",
            breakfast:
              "Hotel breakfast or a familiar cafe near your base.",
            lunch:
              "Dolmen Mall or Boat Basin so restrooms, seating, and familiar food options are easy.",
            dinner:
              "Boat Basin or Clifton/DHA. Keep dinner near the final stop rather than crossing the city late.",
            pacing:
              "Two museums may be enough. Treat the beach as optional if the children are already tired.",
            stops: [
              "tdf-magnifiscience-centre",
              "paf-museum",
              "pakistan-maritime-museum",
              "dolmen-mall-clifton",
              "clifton-beach-horse-camel-rides",
              "boat-basin-food-street",
            ],
            routeNotes:
              "Keep museums early, then use Dolmen Mall or Boat Basin as a flexible air-conditioned break. Beach activities should stay on busy, visible stretches.",
          },
          {
            dayNumber: 2,
            theme: "Park time and a bigger family outing",
            description:
              "Make a deliberate choice: stay in the city with Safari Park, Mohatta, and Sea View, or commit to Bahria Town as the bigger outing. Families usually enjoy the day more when it has one clear anchor.",
            start:
              "Start around 9:30 AM for the in-city version. For Bahria Town, leave earlier and confirm opening hours, ticket rules, and return timing.",
            transport:
              "Private car is best, especially for Bahria Town. Keep ride-hailing as backup for shorter Clifton movements only.",
            breakfast:
              "Hotel breakfast before departure.",
            lunch:
              "Use a mall, family restaurant, or pre-planned stop before the long outing begins.",
            dinner:
              "If returning from Bahria Town, keep dinner simple near the hotel. If staying in Clifton, use Boat Basin or DHA.",
            pacing:
              "Do not force both Safari Park and Bahria Town into a tired afternoon. Pick the route that fits the youngest traveler.",
            stops: [
              "safari-park",
              "mohatta-palace-museum",
              "clifton-beach-sea-view",
              "bahria-adventure-land",
              "grand-jamia-masjid-bahria-town-karachi",
            ],
            routeNotes:
              "Pick either the in-city Clifton/Safari Park rhythm or the Bahria Town outing. Do not try to force both if children are tired or the heat is heavy.",
          },
        ],
      },
      {
        slug: "karachi-old-city-half-day",
        title: "Karachi Old City Half-Day",
        durationDays: 1,
        audience: "budget",
        summary:
          "A focused heritage walk through Tower, M.A. Jinnah Road, old civic buildings, Memon Masjid, Kharadar, Wazir Mansion, and Burns Road.",
        intro:
          "This is a compact, guided old-city plan for travelers who want Karachi's port-era streets, civic buildings, masjid stop, and classic food without spending a full day. It is best done early and with a local host.",
        planning: {
          stay:
            "Best base: Saddar, Civil Lines, or Clifton. Saddar and Civil Lines shorten the route; Clifton is more comfortable for returning after food.",
          transport:
            "Use a driver to enter and leave the area, then walk only selected short stretches with a guide or local host.",
          meals: {
            breakfast:
              "Eat before arriving. The route works best when you begin sightseeing immediately.",
            lunch:
              "Burns Road is the natural lunch or late-lunch anchor.",
            dinner:
              "If you start late, Burns Road can become early dinner; otherwise finish with tea or dessert and return to your base.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Guided heritage walk and old-city food",
            description:
              "Start at Tower, read the old city through its public buildings and masjid, then finish at Burns Road. Keep the route flexible because access, crowds, and traffic can change block by block.",
            start:
              "Begin by 8:30 or 9:00 AM at Merewether Clock Tower with your guide or driver already coordinated for pickup.",
            transport:
              "Driver plus short guided walks. Avoid treating this as a fully independent walking tour.",
            breakfast:
              "Breakfast at your hotel before the route.",
            lunch:
              "Burns Road for the main food stop.",
            dinner:
              "Not required for a half day; if continuing, move to Clifton/DHA for a calmer evening.",
            pacing:
              "Half-day route. Leave before peak heat or extend only if your guide says the area is moving comfortably.",
            stops: [
              "merewether-clock-tower",
              "denso-hall",
              "memon-masjid",
              "wazir-mansion",
              "burns-road-food-street",
            ],
            routeNotes:
              "Start early, keep the route flexible, and use a guide or local host because crowds, parking, traffic, and security conditions can change quickly in the old city.",
          },
        ],
      },
      {
        slug: "karachi-beach-and-coast-day",
        title: "Karachi Beach And Coast Day",
        durationDays: 1,
        audience: "family",
        summary:
          "A coastal Karachi day that can stay easy around Clifton and Sea View or become a planned western-beach outing with advance booking and daylight travel.",
        intro:
          "This coastal plan has two versions: an easy Clifton sunset day or a bigger Hawksbay/Sandspit beach outing. The western-beach version should be planned in advance with confirmed transport, hut access where relevant, and daylight return timing.",
        planning: {
          stay:
            "Best base: Clifton or DHA. You will be closer to Sea View, Do Darya, and the easiest restaurant choices after sunset.",
          transport:
            "Use private transport for Hawksbay or Sandspit. Ride-hailing is fine for Clifton, Mohatta Palace, the shrine, Sea View, and dinner.",
          meals: {
            breakfast:
              "Eat at the hotel before leaving, especially for a western-beach day.",
            lunch:
              "For Clifton, use a cafe or Boat Basin. For Hawksbay/Sandspit, carry water and snacks and confirm food arrangements beforehand.",
            dinner:
              "Do Darya, Boat Basin, or a Clifton/DHA restaurant after sunset.",
          },
        },
        days: [
          {
            dayNumber: 1,
            theme: "Clifton sunset or western beach escape",
            description:
              "Keep the easy version around Mohatta Palace, the shrine, Sea View, and dinner. Choose Hawksbay or Sandspit only when the group is ready for a longer drive and beach logistics.",
            start:
              "For Clifton, begin late morning or early afternoon. For Hawksbay/Sandspit, leave early and confirm sea conditions before departure.",
            transport:
              "Ride-hailing for the Clifton route; private car with a clear return plan for western beaches.",
            breakfast:
              "Hotel breakfast before departure.",
            lunch:
              "Clifton cafe or pre-arranged beach food depending on the version you choose.",
            dinner:
              "Do Darya or Clifton/DHA after sunset, with a reservation for families or larger groups.",
            pacing:
              "Do not combine both Clifton sightseeing and a full western-beach outing unless you have a very early start and strong transport support.",
            stops: [
              "mohatta-palace-museum",
              "abdullah-shah-ghazi-shrine",
              "clifton-beach-sea-view",
              "hawksbay-beach",
              "sandspit-beach",
              "do-darya",
            ],
            routeNotes:
              "For an easy day, stay with Clifton, the shrine, Sea View, and dinner. For Hawksbay or Sandspit, book transport and huts ahead, travel in daylight, and confirm sea conditions.",
          },
        ],
      },
    ],
    seo: {
      title: "Karachi City Guide 2026 | Irhal AI Travel",
      description:
        "A map-first Karachi travel guide with neighborhoods, hotels, places, halal restaurants, masjids, itineraries, and live area locators.",
      canonicalPath: "/city/karachi",
      schemaType: "TravelGuide",
    },
    fullGuide: karachiGuide,
  },
];

export const getCityBySlug = (slug: string) =>
  cities.find((city) => city.slug === slug);

export const getNeighborhood = (city: CityGuide, slug: string) =>
  city.neighborhoods.find((neighborhood) => neighborhood.slug === slug);

const normalizeNeighborhoodInput = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bm\.?\s*a\.?\b/g, "m a")
    .replace(/\bf\.?\s*b\.?\b/g, "f b")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const guideItemAreaAliases: Record<string, string | null> = {
  april: null,
  august: null,
  central: null,
  december: null,
  february: null,
  january: null,
  july: null,
  june: null,
  karachi: null,
  march: null,
  may: null,
  multiple: null,
  "multiple branches": null,
  november: null,
  october: null,
  "off karachi": null,
  "outside karachi": null,
  september: null,
  various: null,
  "what to do with children in tow": null,
  "abdullah haroon road": "saddar",
  "airport area": "malir-cantonment",
  "airport road": "malir-cantonment",
  "avari towers": "saddar",
  "bagh ibn e qasim": "clifton",
  "bahria adventure land": "bahria-town-karachi",
  "bahria town": "bahria-town-karachi",
  "boat from mubarak village snorkeling diving seasonally": "mubarak-village",
  "bolton market m a jinnah road": "m-a-jinnah-road",
  "burns garden": "saddar",
  "chaukhandi tombs thatta shah jahan mosque makli necropolis": null,
  "civil lines club road": "civil-lines",
  "clifton beach horse camel rides": "seaview-clifton-beach",
  "clifton block 5": "clifton",
  "clifton dha": "clifton",
  "clifton harbour": "keamari",
  "club road": "civil-lines",
  dha: "dha-phase-5",
  "dha badar commercial": "dha-phase-5",
  "dha clifton": "dha-phase-5",
  "dha creek": "dha-phase-8",
  "dha creek vista": "dha-phase-8",
  "dha karachi": "dha-phase-5",
  "dha multiple": "dha-phase-5",
  "dha clifton branches": "dha-phase-5",
  "dohs phase 1": "malir-cantonment",
  "delhi colony": "gizri",
  "do darya": "dha-phase-8",
  "dolmen mall clifton": "clifton",
  "dreamworld resort": "gulshan-e-maymar",
  "fatima jinnah road": "saddar",
  "federal b area": "f-b-area",
  "financial district": "m-a-jinnah-road",
  "gadap m9": "gadap",
  "garden east": "garden-east-soldier-bazaar",
  "grand jamia adventure land fountains restaurants": "bahria-town-karachi",
  gulshan: "gulshan-e-iqbal",
  "gulshan jauhar": "gulshan-e-iqbal",
  "gulshan johar": "gulshan-e-iqbal",
  "hawksbay sandspit mubarak village cape monze": "hawksbay",
  "i i chundrigar road": "m-a-jinnah-road",
  "hijrat colony": "civil-lines",
  "jahangir park": "saddar",
  jauhar: "gulistan-e-jauhar",
  "karachi marriott": "civil-lines",
  "karachi zoo": "garden-east-soldier-bazaar",
  kemari: "keamari",
  "keamari tower": "keamari",
  "liaquatabad nazimabad": "liaquatabad",
  "luckyone mall": "f-b-area",
  m9: "gadap",
  malir: "malir-cantonment",
  "malir airport side": "malir-cantonment",
  "marriott": "civil-lines",
  "mohatta palace exterior abdullah shah ghazi seaview do darya dinner": "clifton",
  "moulvi tamizuddin khan road": "keamari",
  "movenpick hotel": "civil-lines",
  "multiple saddar": "saddar",
  "n 5 landhi side": "landhi",
  "natha khan shahrah e faisal side": "shah-faisal-colony",
  "native jetty": "keamari",
  "new town": "university-road",
  "nihari haleem bun kabab rabri bbq and chai": "burns-road",
  "north nazimabad karachi": "north-nazimabad",
  "old city": "kharadar",
  "old city heritage markets civic buildings mosques churches": "saddar",
  "paf museum": "karsaz",
  "paf museum maritime museum national stadium area": "karsaz",
  "pakistan maritime museum": "karsaz",
  "pearl continental": "civil-lines",
  "pns karachi": "karsaz",
  "rahim village karachi": "mubarak-village",
  "rangoonwala centre": "bahadurabad",
  "saddar burns road": "saddar",
  "saddar tariq road": "saddar",
  "safari park": "gulshan-e-iqbal",
  "shahrah e faisal": "karsaz",
  "shahrah e faisal area": "karsaz",
  "shahrah e faisal saddar side": "civil-lines",
  "super highway": "gadap",
  "super highway karachi branches": "gadap",
  "tariq road pechs": "tariq-road",
  "tdf magnifiscience centre": "saddar",
  "tipu sultan road": "pechs",
  "university of karachi": "university-road",
  "west karachi": "orangi-town",
  "west wharf": "keamari",
  "zamzama dha": "zamzama",
};

export const getCanonicalNeighborhoodSlugForArea = (
  city: CityGuide,
  area?: string | null,
) => {
  if (!area) return undefined;

  const normalizedArea = normalizeNeighborhoodInput(area);
  if (!normalizedArea) return undefined;

  if (Object.hasOwn(guideItemAreaAliases, normalizedArea)) {
    return guideItemAreaAliases[normalizedArea] ?? undefined;
  }

  const neighborhoods = city.neighborhoods
    .map((neighborhood) => ({
      ...neighborhood,
      normalizedName: normalizeNeighborhoodInput(neighborhood.name),
      normalizedSlug: normalizeNeighborhoodInput(neighborhood.slug),
    }))
    .sort((left, right) => right.normalizedName.length - left.normalizedName.length);

  const exact = neighborhoods.find(
    (neighborhood) =>
      normalizedArea === neighborhood.normalizedName ||
      normalizedArea === neighborhood.normalizedSlug,
  );
  if (exact) return exact.slug;

  const prefix = neighborhoods.find((neighborhood) =>
    normalizedArea.startsWith(`${neighborhood.normalizedName} `),
  );
  if (prefix) return prefix.slug;

  const containing = neighborhoods.find((neighborhood) =>
    normalizedArea.includes(` ${neighborhood.normalizedName} `) ||
    normalizedArea.endsWith(` ${neighborhood.normalizedName}`),
  );
  if (containing) return containing.slug;

  return undefined;
};

export const getListingsByNeighborhood = (
  city: CityGuide,
  neighborhoodSlug: string,
) =>
  city.listings.filter(
    (listing) => listing.neighborhoodSlug === neighborhoodSlug,
  );

export const getListing = (
  city: CityGuide,
  listingType: ListingType,
  slug: string,
) =>
  city.listings.find(
    (listing) => listing.listingType === listingType && listing.slug === slug,
  );

export const getListingsByTypes = (
  city: CityGuide,
  listingTypes: ListingType[],
) =>
  city.listings.filter((listing) => listingTypes.includes(listing.listingType));

export const getGuideSection = (city: CityGuide, sectionSlug: string) =>
  city.fullGuide.sections.find((section) => section.slug === sectionSlug);

export const getGuideTable = (city: CityGuide, purpose: string) =>
  city.fullGuide.tables.find((table) => table.purpose === purpose);
