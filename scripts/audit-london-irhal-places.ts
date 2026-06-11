import nextEnv from "@next/env";
import dns from "node:dns";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type LegacyPlace = {
  id: number;
  link: string;
  title: { rendered: string };
};

type PayloadItem = Record<string, unknown> & {
  id: number;
  kind?: string;
  slug?: string;
  title?: string;
  importedDetails?: Record<string, unknown>;
  sourceRowId?: string;
};

const entityMap: Record<string, string> = {
  "#038": "&",
  "#039": "'",
  "#8211": "-",
  "#8212": "-",
  "#8216": "'",
  "#8217": "'",
  "#8220": '"',
  "#8221": '"',
  amp: "&",
  nbsp: " ",
  ndash: "-",
  quot: '"',
  rsquo: "'",
};

const explicitSlugMap: Record<string, string> = {
  "barbican": "barbican-centre",
  "emirates-air-line": "ifs-cloud-cable-car",
  "globe-theater": "shakespeare-s-globe",
  "harry-potter-warner-brother-s-studio-tour":
    "warner-bros-studio-tour-london",
  "hyde-park-and-kensington-gardens": "hyde-park",
  "kings-cross-station": "king-s-cross-and-st-pancras",
  "lords-home-of-cricket": "lord-s-cricket-ground",
  "madam-tussauds": "madame-tussauds-london",
  "national-gallery": "the-national-gallery",
  "o2-arena": "the-o2-and-greenwich-peninsula",
  "river-thames-boat-rides": "thames-river-cruise-westminster-to-greenwich",
  "saint-jamess-park": "st-james-s-park",
  "st-pauls-cathedral": "st-paul-s-cathedral",
  "westminster-palace-houses-of-parliament":
    "palace-of-westminster-and-elizabeth-tower",
  "what-to-do-with-kids-in-tow": "children-in-tow",
};

const decodeEntities = (value: string) =>
  value.replace(/&([a-zA-Z]+|#[0-9]+|#x[0-9a-fA-F]+);/g, (_, entity: string) => {
    if (entity.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    }
    if (entity.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    }
    return entityMap[entity] ?? `&${entity};`;
  });

const stripHtml = (value: string) =>
  decodeEntities(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value: string) =>
  stripHtml(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeTitle = (value: string) =>
  slugify(value.replace(/^\*/, "").replace(/\blondon\b/gi, ""));

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: { "user-agent": "IrhalLondonPlaceAudit/1.0 (+https://irhal.com)" },
  });
  if (!response.ok) throw new Error(`Fetch failed ${response.status}: ${url}`);
  return (await response.json()) as T;
};

const legacyPlaces = async () => {
  const places: LegacyPlace[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await fetchJson<LegacyPlace[]>(
      `https://irhal.com/wp-json/wp/v2/place?place-city=150&per_page=100&page=${page}`,
    );
    places.push(...batch);
    if (batch.length < 100) break;
  }

  return places
    .filter((place) =>
      place.link.includes("/travel-guide/london/places-to-visit/"),
    )
    .map((place) => {
      const parts = new URL(place.link).pathname.split("/").filter(Boolean);
      const oldSlug = parts.at(-1) ?? slugify(place.title.rendered);
      const expectedSlug = explicitSlugMap[oldSlug] ?? oldSlug;
      return {
        expectedSlug,
        id: place.id,
        normalizedTitle: normalizeTitle(stripHtml(place.title.rendered)),
        oldSlug,
        title: stripHtml(place.title.rendered),
        url: place.link,
      };
    });
};

const itemKey = (item: PayloadItem) => `${String(item.kind)}:${String(item.slug)}`;

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
  const city = cityResult.docs[0] as PayloadItem | undefined;
  if (!city?.id) throw new Error("London city was not found in Payload.");

  const legacy = await legacyPlaces();
  const itemResult = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    where: { city: { equals: city.id } } as never,
  });
  const items = itemResult.docs as PayloadItem[];

  const byWpId = new Map(
    items
      .filter((item) => item.importedDetails?.legacy_irhal_wp_id)
      .map((item) => [String(item.importedDetails?.legacy_irhal_wp_id), item]),
  );
  const bySourceUrl = new Map(
    items
      .filter((item) => item.importedDetails?.legacy_irhal_source_url)
      .map((item) => [
        String(item.importedDetails?.legacy_irhal_source_url),
        item,
      ]),
  );
  const bySlug = new Map(items.map((item) => [String(item.slug), item]));
  const byTitle = new Map(
    items.map((item) => [normalizeTitle(String(item.title ?? "")), item]),
  );

  const matched = [];
  const missing = [];
  for (const place of legacy) {
    const match =
      byWpId.get(String(place.id)) ??
      bySourceUrl.get(place.url) ??
      bySlug.get(place.expectedSlug) ??
      bySlug.get(place.oldSlug) ??
      byTitle.get(place.normalizedTitle);

    if (match) {
      matched.push({
        legacyId: place.id,
        legacyTitle: place.title,
        legacyUrl: place.url,
        payloadId: match.id,
        payloadKey: itemKey(match),
        payloadTitle: match.title,
      });
    } else {
      missing.push(place);
    }
  }

  console.log(
    JSON.stringify(
      {
        legacyPlacesToVisit: legacy.length,
        matched: matched.length,
        missing: missing.length,
        missingItems: missing,
        payloadGuideItems: itemResult.totalDocs,
        westminsterAbbey: matched.find(
          (item) => item.legacyUrl ===
            "https://irhal.com/travel-guide/london/places-to-visit/westminster-abbey/",
        ),
      },
      null,
      2,
    ),
  );
}

await main();
process.exit(0);
