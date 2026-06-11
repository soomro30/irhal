import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type GuideKind =
  | "place"
  | "hotel"
  | "restaurant"
  | "masjid"
  | "shopping"
  | "tour"
  | "family"
  | "festival";

type LegacyPlace = Record<string, unknown> & {
  id: number;
  slug: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt?: { rendered: string };
  featured_media_url?: string;
  "golo-place_location"?: { location?: string; address?: string };
  "golo-place_address"?: string;
  "golo-place_phone"?: string;
  "golo-place_website"?: string;
};

type PayloadDoc = Record<string, unknown> & {
  id: number;
  title?: string;
  slug?: string;
  kind?: GuideKind;
  body?: unknown;
  summary?: string;
  sources?: Array<Record<string, unknown>>;
  image?: number | { id: number };
  gallery?: Array<{ image?: number | { id: number } }>;
  importedDetails?: Record<string, unknown>;
};

type ImportCandidate = {
  legacy: LegacyPlace | null;
  title: string;
  slug: string;
  kind: GuideKind;
  sectionSlug: string;
  sourceUrl: string;
  imageUrl?: string;
  imageAlt: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
  category: string;
  legacyParagraphs: string[];
  extraParagraphs: string[];
  extraSources?: Array<{
    label: string;
    url: string;
    type: "official" | "editorial";
    confidence: "high" | "medium";
  }>;
};

const verificationDate = "2026-06-11T00:00:00.000Z";
const tmpDir = path.join(os.tmpdir(), "irhal-london-legacy-import");
const cityHeroUrl =
  "https://irhal.com/wp-content/uploads/2021/04/pexels-chait-goli-1796715-scaled-e1617281183805.jpg";

const categoryMap: Record<
  string,
  { kind: GuideKind; sectionSlug: string; category: string }
> = {
  festivals: {
    category: "Annual festival / city event",
    kind: "festival",
    sectionSlug: "festivals-and-annual-events",
  },
  hotels: { category: "Hotel", kind: "hotel", sectionSlug: "hotels" },
  masjids: {
    category: "Masjid / Islamic centre",
    kind: "masjid",
    sectionSlug: "muslim-visitor-information",
  },
  "organized-tours": {
    category: "Organized tour",
    kind: "tour",
    sectionSlug: "organized-tours",
  },
  "places-to-visit": {
    category: "Place to visit",
    kind: "place",
    sectionSlug: "places-to-visit",
  },
  restaurants: {
    category: "Restaurant",
    kind: "restaurant",
    sectionSlug: "food-and-restaurants",
  },
  shopping: { category: "Shopping", kind: "shopping", sectionSlug: "shopping" },
};

const explicitSlugMap: Record<string, string> = {
  "family:what-to-do-with-kids-in-tow": "children-in-tow",
  "hotel:four-seasons-park-lane": "four-seasons-hotel-london-at-park-lane",
  "masjid:central-mosque-of-brent": "central-mosque-of-brent",
  "masjid:finsbury-park-mosque": "finsbury-park-mosque",
  "masjid:harrow-central-mosque-masood-islamic-centre":
    "harrow-central-mosque",
  "masjid:hounslow-jamia-masjid-islamic-centre": "hounslow-jamia-masjid",
  "masjid:the-baitul-futuh-mosque": "baitul-futuh-mosque",
  "masjid:the-east-london-mosque": "east-london-mosque-and-london-muslim-centre",
  "masjid:the-islamic-cultural-centre": "london-central-mosque-and-islamic-cultural-centre",
  "place:barbican": "barbican-centre",
  "place:emirates-air-line": "ifs-cloud-cable-car",
  "place:globe-theater": "shakespeare-s-globe",
  "place:harry-potter-warner-brother-s-studio-tour":
    "warner-bros-studio-tour-london",
  "place:hyde-park-and-kensington-gardens": "hyde-park",
  "place:kings-cross-station": "king-s-cross-and-st-pancras",
  "place:lords-home-of-cricket": "lord-s-cricket-ground",
  "place:madam-tussauds": "madame-tussauds-london",
  "place:national-gallery": "the-national-gallery",
  "place:o2-arena": "the-o2-and-greenwich-peninsula",
  "place:river-thames-boat-rides": "thames-river-cruise-westminster-to-greenwich",
  "place:saint-jamess-park": "st-james-s-park",
  "place:st-pauls-cathedral": "st-paul-s-cathedral",
  "place:westminster-palace-houses-of-parliament":
    "palace-of-westminster-and-elizabeth-tower",
  "restaurant:khan-s-restaurant": "khans-restaurant",
  "restaurant:khans-restaurant": "khans-restaurant",
  "shopping:london-designer-outlet-wembley-park":
    "wembley-park-and-london-designer-outlet",
};

const skipLegacySlugs = new Set([
  "fast-facts",
  "health-and-safety",
  "masjids-in-london",
  "organized-tours",
]);

const officialFestivalSources: Record<
  string,
  Array<{ label: string; url: string; type: "official"; confidence: "high" }>
> = {
  "chelsea-flower-show": [
    {
      confidence: "high",
      label: "RHS Chelsea Flower Show",
      type: "official",
      url: "https://www.rhs.org.uk/shows-events/rhs-chelsea-flower-show",
    },
  ],
  "eid-in-the-square": [
    {
      confidence: "high",
      label: "Mayor of London Eid on the Square",
      type: "official",
      url: "https://www.london.gov.uk/events/eid-square-2026",
    },
  ],
  "london-fashion-week": [
    {
      confidence: "high",
      label: "London Fashion Week",
      type: "official",
      url: "https://londonfashionweek.co.uk/",
    },
    {
      confidence: "high",
      label: "British Fashion Council London Fashion Week applications",
      type: "official",
      url: "https://www.britishfashioncouncil.co.uk/Global-Platforms/LFW-Designer-Applications",
    },
  ],
  "london-film-festival": [
    {
      confidence: "high",
      label: "BFI London Film Festival",
      type: "official",
      url: "https://whatson.bfi.org.uk/lff/Online/default.asp?BOparam::WScontent::loadArticle::permalink=homepagelff",
    },
  ],
  "london-marathon": [
    {
      confidence: "high",
      label: "TCS London Marathon",
      type: "official",
      url: "https://www.londonmarathonevents.co.uk/london-marathon",
    },
  ],
  "lord-mayors-show": [
    {
      confidence: "high",
      label: "Lord Mayor's Show",
      type: "official",
      url: "https://lordmayorsshow.london/",
    },
  ],
  "notting-hill-carnival": [
    {
      confidence: "high",
      label: "Notting Hill Carnival",
      type: "official",
      url: "https://nhcarnival.org/",
    },
    {
      confidence: "high",
      label: "Visit London Notting Hill Carnival",
      type: "official",
      url: "https://www.visitlondon.com/things-to-do/event/9023471-notting-hill-carnival",
    },
  ],
  "open-house-festival": [
    {
      confidence: "high",
      label: "Open House Festival",
      type: "official",
      url: "https://programme.openhouse.org.uk/",
    },
  ],
  "promenade-concerts-the-proms": [
    {
      confidence: "high",
      label: "Royal Albert Hall BBC Proms 2026",
      type: "official",
      url: "https://www.royalalberthall.com/tickets/proms/bbc-proms-2026",
    },
  ],
  "totally-thames-festival": [
    {
      confidence: "high",
      label: "Totally Thames Festival",
      type: "official",
      url: "https://thamesfestivaltrust.org/artistic-programme/totally-thames/",
    },
  ],
  "wimbledon-lawn-tennis-championships": [
    {
      confidence: "high",
      label: "The Championships, Wimbledon",
      type: "official",
      url: "https://www.wimbledon.com/",
    },
  ],
  "winter-wonderland-hyde-park": [
    {
      confidence: "high",
      label: "Hyde Park Winter Wonderland",
      type: "official",
      url: "https://hydeparkwinterwonderland.com/",
    },
  ],
};

const extraFestivalItems: ImportCandidate[] = [
  {
    area: "Trafalgar Square",
    category: "Muslim festival / public culture",
    extraParagraphs: [
      "Eid in the Square is one of London's most important Muslim-facing public celebrations, staged in Trafalgar Square by the Mayor of London with community, arts, food and cultural programming. For Irhal travellers it is more than a photo stop: it is a visible expression of Muslim London in the civic heart of the city.",
      "In 2026 the event marked its twentieth anniversary and celebrated Eid al-Adha with family activities, food stalls, performance, literature, fashion and community programming. Travellers should arrive by public transport, expect bag checks and crowds around Charing Cross, and verify prayer plans separately because the square is a festival site, not a masjid.",
    ],
    extraSources: officialFestivalSources["eid-in-the-square"],
    imageAlt: "Eid in the Square in Trafalgar Square, London",
    kind: "festival",
    legacy: null,
    legacyParagraphs: [],
    sectionSlug: "festivals-and-annual-events",
    slug: "eid-in-the-square",
    sourceUrl: "https://www.london.gov.uk/events/eid-square-2026",
    title: "Eid in the Square",
  },
  {
    area: "Across London",
    category: "Architecture festival",
    extraParagraphs: [
      "Open House Festival is London's citywide architecture and neighbourhood-access festival, opening buildings, civic spaces and guided routes that are normally private or easy to overlook. It is especially valuable for serious city-guide readers because it turns London into a live classroom for housing, faith buildings, livery halls, modern towers, libraries and hidden infrastructure.",
      "The 2026 festival is scheduled for 12-20 September. Many visits are free but require advance booking, and popular buildings can sell out quickly. Muslim families should build routes by neighbourhood, keep prayer and meal stops nearby, and avoid trying to cross the whole city between timed entries.",
    ],
    extraSources: officialFestivalSources["open-house-festival"],
    imageAlt: "Open House Festival architecture visits in London",
    kind: "festival",
    legacy: null,
    legacyParagraphs: [],
    sectionSlug: "festivals-and-annual-events",
    slug: "open-house-festival",
    sourceUrl: "https://programme.openhouse.org.uk/",
    title: "Open House Festival",
  },
  {
    area: "River Thames",
    category: "River arts and heritage festival",
    extraParagraphs: [
      "Totally Thames is a month-long September programme celebrating the River Thames through art, heritage, walks, environmental projects and river-based events. It helps travellers understand the Thames as London's working, ceremonial and social spine rather than just a background view from a bridge.",
      "The strongest Irhal use is itinerary planning: pair a festival walk or riverside event with Westminster, South Bank, Tower Bridge, Greenwich or Canary Wharf. Check each event listing for accessibility, booking and family suitability, because the programme changes from quiet exhibitions to busy outdoor performances.",
    ],
    extraSources: officialFestivalSources["totally-thames-festival"],
    imageAlt: "Totally Thames Festival events along the River Thames",
    kind: "festival",
    legacy: null,
    legacyParagraphs: [],
    sectionSlug: "festivals-and-annual-events",
    slug: "totally-thames-festival",
    sourceUrl: "https://thamesfestivaltrust.org/artistic-programme/totally-thames/",
    title: "Totally Thames Festival",
  },
  {
    area: "Hyde Park",
    category: "Winter festival",
    extraParagraphs: [
      "Hyde Park Winter Wonderland is London's large seasonal winter fair, combining rides, ice skating, shows, markets and festive food in one of the city's best-known parks. It can be exciting for families, but it is also a high-density, ticketed environment where timing matters.",
      "Muslim visitors should treat food as unverified unless a stall clearly provides halal assurance, book timed entry and attractions early, and avoid the busiest evening crush if travelling with children or older relatives. The event usually returns from November into early January, with exact dates and ticket rules published by the organiser each season.",
    ],
    extraSources: officialFestivalSources["winter-wonderland-hyde-park"],
    imageAlt: "Hyde Park Winter Wonderland, London",
    kind: "festival",
    legacy: null,
    legacyParagraphs: [],
    sectionSlug: "festivals-and-annual-events",
    slug: "winter-wonderland-hyde-park",
    sourceUrl: "https://hydeparkwinterwonderland.com/",
    title: "Winter Wonderland Hyde Park",
  },
];

const entityMap: Record<string, string> = {
  "#038": "&",
  "#039": "'",
  "#8211": "-",
  "#8212": "-",
  "#8216": "'",
  "#8217": "'",
  "#8220": '"',
  "#8221": '"',
  "#8230": "...",
  amp: "&",
  hellip: "...",
  lt: "<",
  nbsp: " ",
  ndash: "-",
  quot: '"',
  rsquo: "'",
};

const decodeEntities = (value: string) =>
  value.replace(/&([a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g, (_, entity: string) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entityMap[entity] ?? `&${entity};`;
  });

const stripHtml = (value: string) =>
  decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value: string) =>
  stripHtml(value)
    .toLowerCase()
    .replace(/¾/g, " 3 4 ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeLegacySlug = (value: string) => slugify(value);

const normalizeTitle = (value: string) =>
  slugify(value.replace(/^\*/, "").replace(/\blondon\b/gi, "")).replace(
    /-+/g,
    "-",
  );

const relationshipId = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    return Number((value as { id: unknown }).id);
  }
  return undefined;
};

const bodyToLexical = (paragraphs: string[]) => ({
  root: {
    children: paragraphs
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        textFormat: 0,
        textStyle: "",
        type: "paragraph",
        version: 1,
      })),
    direction: null,
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
});

const lexicalToParagraphs = (value: unknown): string[] => {
  const paragraphs: string[] = [];
  const visit = (node: unknown): string => {
    if (!node || typeof node !== "object") return "";
    const record = node as Record<string, unknown>;
    if (record.type === "text" && typeof record.text === "string") {
      return record.text;
    }
    const children = Array.isArray(record.children) ? record.children : [];
    const text = children.map(visit).join("");
    if (record.type === "paragraph" && text.trim()) paragraphs.push(text.trim());
    return text;
  };
  visit(value);
  return paragraphs;
};

const extractParagraphs = (html: string) => {
  const prepared = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/(p|div|h2|h3|li)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ");

  const text = decodeEntities(prepared.replace(/<[^>]+>/g, " "))
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ");

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 20 && !/^&nbsp;$/i.test(paragraph));
};

const sentenceSummary = (paragraphs: string[], fallback: string) => {
  const base = paragraphs.find((paragraph) => paragraph.length > 50) ?? fallback;
  return base.replace(/\s+/g, " ").slice(0, 310).replace(/\s+\S*$/, ".");
};

const uniqueParagraphs = (paragraphs: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const paragraph of paragraphs) {
    const key = paragraph.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(paragraph);
  }
  return result;
};

const canonicalPathParts = (link: string) => {
  const url = new URL(link);
  const parts = url.pathname.split("/").filter(Boolean);
  const londonIndex = parts.findIndex((part) => part === "london");
  if (londonIndex < 0 || parts.length < londonIndex + 3) return null;
  return {
    category: parts[londonIndex + 1],
    slug: decodeURIComponent(parts[londonIndex + 2]).toLowerCase(),
  };
};

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { "user-agent": "IrhalLegacyLondonImporter/1.0 (+https://irhal.com)" },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return (await response.json()) as T;
}

async function fetchLegacyPlaces() {
  const all: LegacyPlace[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchJson<LegacyPlace[]>(
      `https://irhal.com/wp-json/wp/v2/place?place-city=150&per_page=100&page=${page}`,
    );
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

async function downloadImage(url: string, filenameBase: string) {
  await fs.mkdir(tmpDir, { recursive: true });
  const response = await fetch(url, {
    headers: { "user-agent": "IrhalLegacyLondonImporter/1.0 (+https://irhal.com)" },
  });
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  const extension = path.extname(new URL(url).pathname).split("?")[0] || ".jpg";
  const filePath = path.join(tmpDir, `${slugify(filenameBase).slice(0, 92)}${extension}`);
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

const parseLocation = (legacy: LegacyPlace) => {
  const raw = legacy["golo-place_location"]?.location;
  if (!raw) return {};
  const [lat, lng] = raw
    .split(",")
    .map((part) => Number.parseFloat(part.trim()))
    .filter((value) => Number.isFinite(value));
  return Number.isFinite(lat) && Number.isFinite(lng)
    ? { latitude: lat, longitude: lng }
    : {};
};

const candidateFromLegacy = (legacy: LegacyPlace): ImportCandidate | null => {
  const parts = canonicalPathParts(legacy.link);
  if (!parts) return null;
  if (skipLegacySlugs.has(parts.slug)) return null;
  const category = categoryMap[parts.category];
  if (!category) return null;

  const isChildrenTow = parts.slug === "what-to-do-with-kids-in-tow";
  const title = stripHtml(legacy.title.rendered).replace(/^\*\s*/, "");
  const paragraphs = extractParagraphs(legacy.content.rendered);
  const location = parseLocation(legacy);
  const address =
    legacy["golo-place_location"]?.address ||
    legacy["golo-place_address"] ||
    undefined;

  return {
    address,
    area: address ? address.split(",").slice(-3, -1).join(", ").trim() : undefined,
    category: isChildrenTow ? "Family travel advice" : category.category,
    extraParagraphs: [
      `Irhal archive note: this entry has been recovered from Irhal's legacy London guide and blended into the current Payload city model. Verify opening hours, ticket prices, menus, prayer access and booking rules before travelling, because operational details can change faster than editorial context.`,
    ],
    extraSources: officialFestivalSources[parts.slug],
    imageAlt: `${title}, London`,
    imageUrl: legacy.featured_media_url,
    kind: isChildrenTow ? "family" : category.kind,
    legacy,
    legacyParagraphs: paragraphs,
    sectionSlug: isChildrenTow ? "children-in-tow" : category.sectionSlug,
    slug: normalizeLegacySlug(parts.slug),
    sourceUrl: legacy.link,
    title,
    ...location,
  };
};

const makeSources = (existing: PayloadDoc | undefined, candidate: ImportCandidate) => {
  const sources = [...(Array.isArray(existing?.sources) ? existing.sources : [])];
  const add = (
    label: string,
    url: string,
    type: "official" | "editorial",
    confidence: "high" | "medium",
  ) => {
    if (sources.some((source) => source.url === url)) return;
    sources.push({ confidence, label, type, url, verifiedAt: verificationDate });
  };

  add("Irhal legacy London guide", candidate.sourceUrl, "editorial", "high");
  for (const source of candidate.extraSources ?? []) {
    add(source.label, source.url, source.type, source.confidence);
  }
  return sources;
};

const composeBody = (existing: PayloadDoc | undefined, candidate: ImportCandidate) => {
  const existingParagraphs = lexicalToParagraphs(existing?.body);
  const paragraphs = existing
    ? [
        ...existingParagraphs,
        ...candidate.legacyParagraphs,
        ...candidate.extraParagraphs,
      ]
    : [...candidate.legacyParagraphs, ...candidate.extraParagraphs];

  return bodyToLexical(uniqueParagraphs(paragraphs).slice(0, 18));
};

const seoSchemaType = (kind: GuideKind) =>
  kind === "restaurant"
    ? "Restaurant"
    : kind === "hotel"
      ? "Hotel"
      : kind === "festival"
        ? "Event"
        : kind === "masjid"
          ? "PlaceOfWorship"
          : "Place";

async function ensureMedia(
  payload: Awaited<ReturnType<typeof getPayload>>,
  url: string | undefined,
  title: string,
  options: { hero?: boolean } = {},
) {
  if (!url) return undefined;
  const existing = await payload.find({
    collection: "media" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { sourceUrl: { equals: url } },
  });
  const existingDocs = existing.docs as PayloadDoc[];
  if (existingDocs[0]?.id) return Number(existingDocs[0].id);

  const filePath = await downloadImage(url, title);
  const created = await payload.create({
    collection: "media" as never,
    data: {
      alt: options.hero ? "London city guide hero image" : `${title}, London`,
      attribution: "Irhal legacy editorial archive",
      caption: options.hero
        ? "London city guide hero image from Irhal's owned media archive."
        : `${title}, London. Source: Irhal legacy editorial archive.`,
      license: "owned",
      sourceUrl: url,
      usageNotes: options.hero
        ? "User-requested London city hero image from the owned Irhal WordPress media archive."
        : "Imported from the owned Irhal legacy WordPress archive during London content recovery.",
      usageStatus: "approved",
    } as never,
    filePath,
    overrideAccess: true,
  });
  return Number((created as PayloadDoc).id);
}

async function main() {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
  }

  const payload = await getPayload({ config });
  const cityResult = await payload.find({
    collection: "cities" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: "london" } },
  });
  const city = cityResult.docs[0] as PayloadDoc | undefined;
  if (!city?.id) throw new Error("London city was not found in Payload.");

  const sectionResult = await payload.find({
    collection: "guide-sections" as never,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    where: { city: { equals: city.id } },
  });
  const sectionIdBySlug = new Map(
    (sectionResult.docs as PayloadDoc[]).map((section) => [
      section.sectionSlug as string,
      section.id,
    ]),
  );

  const existingResult = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    where: { city: { equals: city.id } },
  });
  const existingItems = existingResult.docs as PayloadDoc[];
  const byKey = new Map(existingItems.map((item) => [`${item.kind}:${item.slug}`, item]));
  const byTitle = new Map(
    existingItems.map((item) => [
      `${item.kind}:${normalizeTitle(String(item.title ?? ""))}`,
      item,
    ]),
  );

  const heroMediaId = await ensureMedia(payload, cityHeroUrl, "london-city-hero", {
    hero: true,
  });
  if (heroMediaId) {
    await payload.update({
      collection: "cities" as never,
      data: {
        heroGallery: [],
        heroImage: heroMediaId,
        workflowStatus: "published",
      } as never,
      id: city.id,
      overrideAccess: true,
    });
    console.log(`hero:set london -> media #${heroMediaId}`);
  }

  const legacyPlaces = await fetchLegacyPlaces();
  const candidates = [
    ...legacyPlaces.map(candidateFromLegacy).filter(Boolean),
    ...extraFestivalItems,
  ] as ImportCandidate[];
  const deduped = new Map<string, ImportCandidate>();
  for (const candidate of candidates) {
    deduped.set(`${candidate.kind}:${candidate.slug}`, candidate);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const candidate of deduped.values()) {
    const sectionId = sectionIdBySlug.get(candidate.sectionSlug);
    if (!sectionId) {
      console.warn(`skip ${candidate.kind}:${candidate.slug}; missing section ${candidate.sectionSlug}`);
      skipped += 1;
      continue;
    }

    const mappedSlug =
      explicitSlugMap[`${candidate.kind}:${candidate.slug}`] ?? candidate.slug;
    const existing =
      byKey.get(`${candidate.kind}:${mappedSlug}`) ??
      byKey.get(`${candidate.kind}:${candidate.slug}`) ??
      byTitle.get(`${candidate.kind}:${normalizeTitle(candidate.title)}`);

    const existingImageId = relationshipId(existing?.image);
    const mediaId = existingImageId
      ? existingImageId
      : await ensureMedia(payload, candidate.imageUrl, candidate.title).catch((error) => {
          console.warn(`media skipped ${candidate.kind}:${candidate.slug}: ${String(error)}`);
          return undefined;
        });

    const paragraphs = [
      ...candidate.legacyParagraphs,
      ...candidate.extraParagraphs,
    ];
    const summary =
      existing?.summary && existing.summary.length > 90
        ? existing.summary
        : sentenceSummary(paragraphs, candidate.title);
    const sources = makeSources(existing, candidate);
    const importedDetails = {
      ...(existing?.importedDetails ?? {}),
      legacy_irhal_source_url: candidate.sourceUrl,
      legacy_irhal_wp_id: candidate.legacy?.id,
      legacy_irhal_verified_at: verificationDate,
      legacy_irhal_confidence: "high",
      london_legacy_import_batch: "2026-06-11-london-irhal-legacy-archive",
    };
    const gallery =
      existing?.gallery && Array.isArray(existing.gallery) && existing.gallery.length > 0
        ? existing.gallery
        : mediaId
          ? [{ image: mediaId }]
          : undefined;

    if (existing?.id) {
      await payload.update({
        collection: "guide-items" as never,
        data: {
          address: existing.address || candidate.address,
          area: existing.area || candidate.area,
          body: composeBody(existing, candidate),
          category: existing.category || candidate.category,
          gallery,
          geoStatus:
            existing.geoStatus ||
            (candidate.latitude && candidate.longitude
              ? "verified"
              : "provider-enrichment-required"),
          image: mediaId,
          imageAlt: existing.imageAlt || candidate.imageAlt,
          importedDetails,
          latitude: existing.latitude || candidate.latitude,
          longitude: existing.longitude || candidate.longitude,
          mapUrl:
            existing.mapUrl ||
            (candidate.latitude && candidate.longitude
              ? `https://www.google.com/maps/search/?api=1&query=${candidate.latitude},${candidate.longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${candidate.title}, London, United Kingdom`,
                )}`),
          seo: {
            description: `${summary} Updated with Irhal's legacy London editorial archive and current traveller verification notes.`,
            robots: "index,follow",
            schemaType: seoSchemaType(candidate.kind),
            title: `${existing.title ?? candidate.title} | London`,
          },
          sources,
          summary,
          workflowStatus: "updated",
          _status: "published",
        } as never,
        id: existing.id,
        overrideAccess: true,
      });
      updated += 1;
      console.log(`updated ${candidate.kind}:${candidate.slug} -> #${existing.id}`);
      continue;
    }

    const createdDoc = await payload.create({
      collection: "guide-items" as never,
      data: {
        address: candidate.address,
        area: candidate.area,
        body: composeBody(undefined, candidate),
        category: candidate.category,
        city: city.id,
        gallery,
        geoStatus:
          candidate.latitude && candidate.longitude
            ? "verified"
            : "provider-enrichment-required",
        image: mediaId,
        imageAlt: candidate.imageAlt,
        importedDetails,
        kind: candidate.kind,
        latitude: candidate.latitude,
        longitude: candidate.longitude,
        mapUrl:
          candidate.latitude && candidate.longitude
            ? `https://www.google.com/maps/search/?api=1&query=${candidate.latitude},${candidate.longitude}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${candidate.title}, London, United Kingdom`,
              )}`,
        section: sectionId,
        sectionSlug: candidate.sectionSlug,
        seo: {
          description: `${summary} Updated with Irhal's legacy London editorial archive and current traveller verification notes.`,
          robots: "index,follow",
          schemaType: seoSchemaType(candidate.kind),
          title: `${candidate.title} | London`,
        },
        slug: candidate.slug,
        sourceRowId: candidate.legacy ? `irhal-wp-place-${candidate.legacy.id}` : candidate.slug,
        sourceTable: "irhal_legacy_wordpress_place",
        sources,
        summary,
        title: candidate.title,
        workflowStatus: "published",
        _status: "published",
      } as never,
      overrideAccess: true,
    });
    byKey.set(`${candidate.kind}:${candidate.slug}`, createdDoc as PayloadDoc);
    byTitle.set(
      `${candidate.kind}:${normalizeTitle(candidate.title)}`,
      createdDoc as PayloadDoc,
    );
    created += 1;
    console.log(
      `created ${candidate.kind}:${candidate.slug} -> #${(createdDoc as PayloadDoc).id}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        candidates: deduped.size,
        created,
        heroMediaId,
        skipped,
        updated,
      },
      null,
      2,
    ),
  );
}

await main();
