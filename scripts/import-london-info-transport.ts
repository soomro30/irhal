import nextEnv from "@next/env";
import dns from "node:dns";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type GuideKind = "place" | "tour";

type LegacyPlace = {
  id: number;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
};

type PayloadDoc = Record<string, unknown> & {
  id: number;
  image?: number | { id: number };
  heroImage?: number | { id: number };
  importedDetails?: Record<string, unknown>;
  sources?: Array<Record<string, unknown>>;
};

type Target = {
  id: number;
  kind: GuideKind;
  sectionSlug:
    | "city-information"
    | "visitor-information"
    | "transportation-and-getting-around";
  slug: string;
  category: string;
  area: string;
  summaryFallback: string;
  extraParagraphs: string[];
  sources: Array<{
    confidence: "high" | "medium";
    label: string;
    type: "editorial" | "official";
    url: string;
  }>;
};

const verificationDate = "2026-06-11T00:00:00.000Z";

const officialSources = {
  bankHolidays: {
    confidence: "high",
    label: "GOV.UK bank holidays",
    type: "official",
    url: "https://www.gov.uk/bank-holidays",
  },
  tflPayments: {
    confidence: "high",
    label: "Transport for London visitor payments",
    type: "official",
    url: "https://tfl.gov.uk/travel-information/visiting-london/getting-around-london/best-ways-for-visitors-to-pay",
  },
  ukVisa: {
    confidence: "high",
    label: "GOV.UK check if you need a UK visa",
    type: "official",
    url: "https://www.gov.uk/check-uk-visa",
  },
  visitBritainVisa: {
    confidence: "high",
    label: "VisitBritain visa and immigration information",
    type: "official",
    url: "https://www.visitbritain.com/en/plan-your-trip/visa-and-immigration-information",
  },
  visitLondonGettingAround: {
    confidence: "high",
    label: "Visit London getting around London",
    type: "official",
    url: "https://www.visitlondon.com/traveller-information/getting-around-london",
  },
  visitLondonHolidays: {
    confidence: "high",
    label: "Visit London public holidays",
    type: "official",
    url: "https://www.visitlondon.com/traveller-information/essential-information/public-holidays",
  },
} as const;

const targets: Target[] = [
  {
    area: "Historic London",
    category: "City history",
    extraParagraphs: [
      "Irhal editorial note: use this background before planning Westminster, the City, South Bank, Tower Bridge, Greenwich and museum-heavy days. London rewards travellers who understand that Roman, royal, imperial, financial, migrant and Muslim histories overlap in the same streets.",
    ],
    id: 13712,
    kind: "place",
    sectionSlug: "city-information",
    slug: "london-history",
    sources: [],
    summaryFallback:
      "London's history runs from Roman Londinium through royal, mercantile, imperial and modern multicultural chapters.",
  },
  {
    area: "Greater London",
    category: "City overview",
    extraParagraphs: [
      "Irhal editorial note: London today is best understood as a set of connected villages and global districts rather than a single centre. Muslim travellers can combine Westminster, South Kensington, South Bank and royal parks with Whitechapel, Edgware Road, Southall, Green Street and Regent's Park Mosque for a fuller view of the city.",
    ],
    id: 13710,
    kind: "place",
    sectionSlug: "city-information",
    slug: "london-today",
    sources: [],
    summaryFallback:
      "London today is a global capital of finance, culture, migration, theatre, museums, parks and public life.",
  },
  {
    area: "London",
    category: "Weather and seasons",
    extraParagraphs: [
      "For trip planning, late spring and early autumn usually offer the best balance of daylight, park life, hotel rates and manageable crowds. Summer has long days and major events, but attractions and transport corridors are busier; winter is darker and colder, yet December brings lights, markets and theatre seasons.",
      "Pack for changeable weather in every month. A light waterproof layer and comfortable shoes matter more than trying to predict a perfectly dry week.",
    ],
    id: 13708,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "london-weather-and-annual-temperature",
    sources: [officialSources.visitLondonHolidays],
    summaryFallback:
      "London has mild, changeable weather with cool winters, comfortable summers and rain possible throughout the year.",
  },
  {
    area: "England and Wales",
    category: "Public holidays",
    extraParagraphs: [
      "Bank holiday dates change each year, and some holiday Mondays affect museum hours, shop hours, road traffic and rail engineering works. For London, use the England and Wales bank holiday calendar and verify Christmas, New Year and Easter closures before booking fixed-time attractions.",
    ],
    id: 13706,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "london-public-holidays",
    sources: [officialSources.bankHolidays, officialSources.visitLondonHolidays],
    summaryFallback:
      "London follows the England and Wales public holiday calendar, with closures and transport changes around major bank holidays.",
  },
  {
    area: "United Kingdom",
    category: "Currency",
    extraParagraphs: [
      "The United Kingdom uses the pound sterling (GBP). Contactless cards, Apple Pay and Google Pay are widely accepted across London transport, restaurants, shops and attractions, but travellers should still carry a small cash reserve for markets, tips, deposits or small independent businesses.",
      "Exchange rates move daily. Avoid treating an old printed rate as current; check your bank, card issuer or a reliable live rate before committing to a large cash exchange.",
    ],
    id: 13704,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "london-currency-and-exchange-rates",
    sources: [],
    summaryFallback:
      "London uses the pound sterling, with card and contactless payments widely accepted across the city.",
  },
  {
    area: "London",
    category: "Fast facts",
    extraParagraphs: [
      "For public transport, most visitor itineraries sit in Zones 1 and 2, while Heathrow reaches Zone 6. The city code is 020 inside the UK and +44 20 internationally. Emergency services are reached on 999, with 112 also supported.",
    ],
    id: 13702,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "london-fast-facts",
    sources: [],
    summaryFallback:
      "Essential London facts for first-time visitors: location, phone codes, emergency numbers, zones and basic city orientation.",
  },
  {
    area: "United Kingdom",
    category: "Visa and entry",
    extraParagraphs: [
      "Entry rules depend on nationality, passport, purpose of travel and transit route. Some visitors need a visa; others may need an Electronic Travel Authorisation. Always check GOV.UK before travel, because airline boarding and border checks use the current rule set, not old guidebook assumptions.",
    ],
    id: 13699,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "london-visa-information",
    sources: [officialSources.ukVisa, officialSources.visitBritainVisa],
    summaryFallback:
      "UK entry requirements vary by nationality and trip purpose, so London travellers should verify visa or ETA needs before departure.",
  },
  {
    area: "London",
    category: "Best time to visit",
    extraParagraphs: [
      "For a balanced Irhal itinerary, May, June, September and early October are usually easier than peak school-holiday weeks. December is strong for lights, shopping and theatre, but daylight is short and hotel prices can rise around Christmas.",
    ],
    id: 13700,
    kind: "place",
    sectionSlug: "visitor-information",
    slug: "when-to-go-to-london",
    sources: [officialSources.visitLondonHolidays],
    summaryFallback:
      "London can work year-round, but spring, early summer and early autumn usually balance weather, daylight and manageable crowds.",
  },
  {
    area: "Across London",
    category: "Bus network",
    extraParagraphs: [
      "Buses are useful for families, prams, step-free journeys and scenic surface routes. They are slower than the Tube in heavy traffic, but a front upper-deck seat can turn an ordinary journey into a city tour.",
    ],
    id: 13924,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "london-buses",
    sources: [officialSources.visitLondonGettingAround, officialSources.tflPayments],
    summaryFallback:
      "London's bus network is extensive, cashless and useful for affordable surface journeys across the city.",
  },
  {
    area: "Across London",
    category: "London Underground",
    extraParagraphs: [
      "The Tube is usually the fastest way to move between major sights. Check line status before fixed-time bookings, avoid peak commuter crushes when possible, and build walking time into interchanges because large stations can take longer than they look on the map.",
    ],
    id: 13922,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "london-underground-tube",
    sources: [officialSources.visitLondonGettingAround, officialSources.tflPayments],
    summaryFallback:
      "The London Underground is the city's core rapid-transit system and often the quickest way between major visitor areas.",
  },
  {
    area: "Across London",
    category: "Taxis and minicabs",
    extraParagraphs: [
      "Use licensed black cabs or properly booked private-hire/minicab services. Late at night, with luggage or when travelling with older relatives, a direct taxi can be worth the fare; for regular sightseeing days, mix taxis with Tube, buses and walking.",
    ],
    id: 13926,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "london-taxis",
    sources: [officialSources.visitLondonGettingAround],
    summaryFallback:
      "London taxis and licensed private-hire cars are useful for luggage, late nights and direct door-to-door journeys.",
  },
  {
    area: "London airports",
    category: "Airport transfer",
    extraParagraphs: [
      "London has multiple airports, so airport transfer advice is airport-specific. Heathrow has Underground, Elizabeth line, coach and rail options; Gatwick, Stansted and Luton rely heavily on rail/coach links; London City is close to the DLR. Check terminal, luggage, prayer/meal timing and late-night arrival windows before choosing.",
    ],
    id: 13928,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "from-london-airports",
    sources: [officialSources.tflPayments, officialSources.visitLondonGettingAround],
    summaryFallback:
      "Airport transfers in London depend heavily on which airport and terminal you use, from Heathrow to Gatwick, Stansted, Luton and City.",
  },
  {
    area: "Greater London and day trips",
    category: "Car hire",
    extraParagraphs: [
      "Do not hire a car for ordinary central London sightseeing. Car hire makes more sense for outer-London stays, countryside day trips or onward travel to places such as Oxford, Windsor, Brighton, Hampton Court or the Cotswolds.",
    ],
    id: 13930,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "car-hire-in-london",
    sources: [officialSources.visitLondonGettingAround],
    summaryFallback:
      "Car hire is rarely needed inside central London, but it can help with outer-city stays and day trips beyond the capital.",
  },
  {
    area: "Greater London",
    category: "Driving advice",
    extraParagraphs: [
      "Visitors who drive should understand left-side driving, parking rules, bus lanes, congestion charging, low-emission charging zones and strict camera enforcement. For most London days, public transport plus walking is simpler, cheaper and less stressful.",
    ],
    id: 13932,
    kind: "tour",
    sectionSlug: "transportation-and-getting-around",
    slug: "driving-tips-for-london",
    sources: [officialSources.visitLondonGettingAround],
    summaryFallback:
      "Driving in London requires care around traffic, charges, parking, bus lanes, cameras and emission zones.",
  },
];

const entityMap: Record<string, string> = {
  "#038": "&",
  "#039": "'",
  "#160": " ",
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

const extractParagraphs = (html: string) =>
  decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/{loadposition\s+currency}/gi, "")
      .replace(/<\/(p|div|h2|h3|li|tr)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "- ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.replace(/\n+/g, " ").trim())
    .filter((paragraph) => paragraph.length > 16);

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

const sentenceSummary = (paragraphs: string[], fallback: string) => {
  const base = paragraphs.find((paragraph) => paragraph.length > 70) ?? fallback;
  return base.replace(/\s+/g, " ").slice(0, 300).replace(/\s+\S*$/, ".");
};

const relationshipId = (value: unknown) => {
  if (typeof value === "number") return value;
  if (value && typeof value === "object" && "id" in value) {
    return Number((value as { id: unknown }).id);
  }
  return undefined;
};

async function fetchLegacyPlace(id: number) {
  const response = await fetch(`https://irhal.com/wp-json/wp/v2/place/${id}`, {
    headers: {
      "user-agent": "IrhalLondonInfoTransportImporter/1.0 (+https://irhal.com)",
    },
  });
  if (!response.ok) throw new Error(`Legacy fetch failed ${response.status}: ${id}`);
  return (await response.json()) as LegacyPlace;
}

const makeSources = (existing: PayloadDoc | undefined, target: Target, legacy: LegacyPlace) => {
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

  add("Irhal legacy London guide", legacy.link, "editorial", "high");
  for (const source of target.sources) {
    add(source.label, source.url, source.type, source.confidence);
  }
  return sources;
};

const seoSchemaType = (target: Target) =>
  target.sectionSlug === "transportation-and-getting-around"
    ? "TouristTrip"
    : "TouristAttraction";

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
      String(section.sectionSlug),
      section.id,
    ]),
  );

  const existingResult = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    where: { city: { equals: city.id } } as never,
  });
  const targetKeys = new Set(
    targets.map((target) => `${target.kind}:${target.slug}`),
  );
  const existingByKey = new Map(
    (existingResult.docs as PayloadDoc[])
      .map((item) => [`${String(item.kind)}:${String(item.slug)}`, item] as const)
      .filter(([key]) => targetKeys.has(key)),
  );
  const heroImageId = relationshipId(city.heroImage);

  let created = 0;
  let updated = 0;
  const imported: string[] = [];

  for (const target of targets) {
    const sectionId = sectionIdBySlug.get(target.sectionSlug);
    if (!sectionId) throw new Error(`Missing London guide section ${target.sectionSlug}`);

    const legacy = await fetchLegacyPlace(target.id);
    const title = stripHtml(legacy.title.rendered);
    const paragraphs = uniqueParagraphs([
      ...extractParagraphs(legacy.content.rendered),
      ...target.extraParagraphs,
    ]).slice(0, 18);
    const summary = sentenceSummary(paragraphs, target.summaryFallback);
    const existing = existingByKey.get(`${target.kind}:${target.slug}`);
    const existingImageId = relationshipId(existing?.image);
    const imageId =
      existingImageId ??
      (target.sectionSlug === "city-information" ||
      target.sectionSlug === "visitor-information"
        ? heroImageId
        : undefined);
    const sources = makeSources(existing, target, legacy);

    const data = {
      area: target.area,
      body: bodyToLexical(paragraphs),
      category: target.category,
      city: city.id,
      geoStatus: "provider-enrichment-required",
      ...(imageId ? { image: imageId } : {}),
      imageAlt: `${title}, London`,
      importedDetails: {
        ...(existing?.importedDetails ?? {}),
        legacy_irhal_source_url: legacy.link,
        legacy_irhal_verified_at: verificationDate,
        legacy_irhal_wp_id: legacy.id,
        london_info_transport_import_batch: "2026-06-11-london-info-transport",
      },
      kind: target.kind,
      mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${title}, London, United Kingdom`,
      )}`,
      section: sectionId,
      sectionSlug: target.sectionSlug,
      seo: {
        description: summary,
        robots: "index,follow",
        schemaType: seoSchemaType(target),
        title: `${title} | London`,
      },
      slug: target.slug,
      sourceRowId: `irhal-wp-place-${legacy.id}`,
      sourceTable: "irhal_legacy_wordpress_city_info_transport",
      sources,
      summary,
      title,
      workflowStatus: "published",
      _status: "published",
    };

    if (existing?.id) {
      await payload.update({
        collection: "guide-items" as never,
        data: data as never,
        id: existing.id,
        overrideAccess: true,
      });
      updated += 1;
      console.log(`updated ${target.kind}:${target.slug} -> #${existing.id}`);
    } else {
      const createdDoc = await payload.create({
        collection: "guide-items" as never,
        data: data as never,
        overrideAccess: true,
      });
      existingByKey.set(`${target.kind}:${target.slug}`, createdDoc as PayloadDoc);
      created += 1;
      console.log(`created ${target.kind}:${target.slug} -> #${(createdDoc as PayloadDoc).id}`);
    }

    imported.push(`${target.sectionSlug}/${target.slug}`);
  }

  console.log(JSON.stringify({ created, imported, updated }, null, 2));
}

await main();
