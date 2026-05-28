import karachiGuideJson from "../data/karachi-guide.json";

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
  timezone: string;
  currency: string;
  languages: string[];
  latitude: number;
  longitude: number;
  mapUrl: string;
  lastVerifiedAt: string;
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

const googleMaps = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
const karachiGuide = karachiGuideJson as CityGuideImport;

export const cities: CityGuide[] = [
  {
    slug: "karachi",
    name: "Karachi",
    country: "Pakistan",
    region: "Sindh",
    locale: "en",
    lede:
      "Karachi is Pakistan's largest coastal city, a business capital, food powerhouse, and layered urban gateway where historic quarters, beach districts, shopping corridors, masjids, and family-friendly attractions need neighborhood-led navigation.",
    timezone: "Asia/Karachi",
    currency: "PKR",
    languages: ["Urdu", "English", "Sindhi"],
    latitude: 24.8607,
    longitude: 67.0011,
    mapUrl: googleMaps("Karachi Pakistan"),
    lastVerifiedAt: "2026-05-26",
    fastFacts: [
      { label: "Best first base", value: "Clifton or DHA for sea-facing access and restaurants" },
      { label: "Airport", value: "Jinnah International Airport" },
      { label: "Visitor rhythm", value: "Plan by neighborhood because cross-city travel can be slow" },
      { label: "Muslim travel", value: "Masjids are widespread; women prayer facilities need place-level verification" },
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
    neighborhoods: [
      {
        slug: "clifton",
        name: "Clifton",
        district: "South Karachi",
        zone: "coastal",
        clusterType: "waterfront",
        latitude: 24.8138,
        longitude: 67.0307,
        mapUrl: googleMaps("Clifton Karachi"),
        operatingGuide:
          "Clifton works as a premium coastal base for first-time visitors, families, malls, restaurants, beach access, and short hops to DHA.",
        bestFor: ["Hotels", "Restaurants", "Family outings", "Beach access", "Shopping"],
        liveMapQueries: [
          { label: "Halal restaurants nearby", query: "halal restaurants in Clifton Karachi", providerUrl: googleMaps("halal restaurants in Clifton Karachi") },
          { label: "Masjids nearby", query: "masjids in Clifton Karachi", providerUrl: googleMaps("masjids in Clifton Karachi") },
          { label: "Hotels nearby", query: "hotels in Clifton Karachi", providerUrl: googleMaps("hotels in Clifton Karachi") },
        ],
      },
      {
        slug: "saddar",
        name: "Saddar",
        district: "South Karachi",
        zone: "central",
        clusterType: "historic",
        latitude: 24.8602,
        longitude: 67.0311,
        mapUrl: googleMaps("Saddar Karachi"),
        operatingGuide:
          "Saddar is the dense historic-commercial core, useful for colonial-era landmarks, markets, older food streets, and heritage walking clusters.",
        bestFor: ["Historic buildings", "Markets", "Budget shopping", "Street food"],
        liveMapQueries: [
          { label: "Heritage places nearby", query: "historic places in Saddar Karachi", providerUrl: googleMaps("historic places in Saddar Karachi") },
          { label: "Masjids nearby", query: "masjids in Saddar Karachi", providerUrl: googleMaps("masjids in Saddar Karachi") },
          { label: "Shopping nearby", query: "shopping in Saddar Karachi", providerUrl: googleMaps("shopping in Saddar Karachi") },
        ],
      },
      {
        slug: "dha",
        name: "DHA",
        district: "Korangi and South Karachi",
        zone: "coastal",
        clusterType: "food",
        latitude: 24.7897,
        longitude: 67.0567,
        mapUrl: googleMaps("DHA Karachi"),
        operatingGuide:
          "DHA is a restaurant-heavy, residential-commercial cluster that pairs well with Clifton for premium dining, cafes, hotels, and evening movement.",
        bestFor: ["Restaurants", "Cafes", "Premium hotels", "Evenings"],
        liveMapQueries: [
          { label: "Halal restaurants nearby", query: "halal restaurants in DHA Karachi", providerUrl: googleMaps("halal restaurants in DHA Karachi") },
          { label: "Masjids nearby", query: "masjids in DHA Karachi", providerUrl: googleMaps("masjids in DHA Karachi") },
          { label: "Cafes nearby", query: "cafes in DHA Karachi", providerUrl: googleMaps("cafes in DHA Karachi") },
        ],
      },
    ],
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
          description: "Map-first visitor guide to Mohatta Palace Museum in Clifton, Karachi.",
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
        muslimTravel: { familyFriendly: true, notes: "Respectful dress and behavior are expected." },
        seo: {
          title: "Mazar-e-Quaid Karachi Islamic Landmark",
          description: "Visitor and map guide to Mazar-e-Quaid in Karachi.",
          schemaType: "TouristAttraction",
        },
        lastVerifiedAt: "2026-05-26",
      },
      {
        slug: "bait-ul-mukarram-masjid",
        name: "Bait-ul-Mukarram Masjid",
        listingType: "masjid",
        neighborhoodSlug: "dha",
        address: "DHA Karachi",
        latitude: 24.803,
        longitude: 67.063,
        mapUrl: googleMaps("Bait-ul-Mukarram Masjid DHA Karachi"),
        shortDescription:
          "A prominent masjid entry used by the Muslim travel layer for prayer-aware local discovery.",
        muslimTravel: { womenPrayerArea: true, notes: "Women prayer area should be reverified before publishing as final." },
        seo: {
          title: "Bait-ul-Mukarram Masjid Karachi",
          description: "Masjid listing with map and Muslim travel attributes in Karachi.",
          schemaType: "Place",
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
        muslimTravel: { isHalal: true, familyFriendly: true, notes: "Halal status must remain source-verified in CMS." },
        seo: {
          title: "BBQ Tonight Clifton Karachi Restaurant",
          description: "Restaurant listing for BBQ Tonight Clifton with halal and family travel attributes.",
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
          description: "Hotel listing with map, neighborhood context, and travel planning notes.",
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
            stops: ["mohatta-palace", "quaid-e-azam-mausoleum", "bbq-tonight-clifton"],
            routeNotes: "Start in Clifton, move to the central landmark cluster, then return coastal for dinner.",
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

export const getCityBySlug = (slug: string) => cities.find((city) => city.slug === slug);

export const getNeighborhood = (city: CityGuide, slug: string) =>
  city.neighborhoods.find((neighborhood) => neighborhood.slug === slug);

export const getListingsByNeighborhood = (city: CityGuide, neighborhoodSlug: string) =>
  city.listings.filter((listing) => listing.neighborhoodSlug === neighborhoodSlug);

export const getListing = (city: CityGuide, listingType: ListingType, slug: string) =>
  city.listings.find((listing) => listing.listingType === listingType && listing.slug === slug);

export const getListingsByTypes = (city: CityGuide, listingTypes: ListingType[]) =>
  city.listings.filter((listing) => listingTypes.includes(listing.listingType));

export const getGuideSection = (city: CityGuide, sectionSlug: string) =>
  city.fullGuide.sections.find((section) => section.slug === sectionSlug);

export const getGuideTable = (city: CityGuide, purpose: string) =>
  city.fullGuide.tables.find((table) => table.purpose === purpose);
