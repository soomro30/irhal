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
  days: {
    dayNumber: number;
    theme: string;
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
  blocks: GuideBlock[];
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

export type CityGuide = {
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
  guideItemImages?: Record<string, string>;
  guideItemGalleries?: Record<string, string[]>;
  guideItemNeighborhoods?: Record<string, string>;
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
          "A tight first-time route that keeps the day focused on Clifton, Saddar heritage, and a halal-friendly dinner stop.",
        days: [
          {
            dayNumber: 1,
            theme: "Coast, culture, and classic Karachi food",
            stops: [
              "mohatta-palace",
              "quaid-e-azam-mausoleum",
              "bbq-tonight-clifton",
            ],
            routeNotes:
              "Start in Clifton, move to the central landmark cluster, then return coastal for dinner.",
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
