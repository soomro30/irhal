import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

import sharp from "sharp";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString?: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (
      text: string,
      values?: unknown[],
    ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  };
};

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type GuideItemRow = {
  id: number;
  kind: string;
  title: string;
  slug: string;
  image_id: number | null;
  area: string | null;
  category: string | null;
  sources: SourceRow[];
};

type SourceRow = {
  label: string | null;
  url: string | null;
  type: string | null;
  confidence: string | null;
};

type Candidate = {
  source: "irhal" | "commons";
  imageUrl: string;
  pageUrl: string;
  license: "owned" | "creative-commons" | "public-domain" | "editorial-review-required";
  usageStatus: "approved" | "draft";
  attribution?: string;
  photographer?: string;
  width?: number;
  height?: number;
  confidence: "high" | "medium";
  notes: string;
};

type ReportRow = {
  kind: string;
  slug: string;
  title: string;
  status: "linked" | "skipped" | "failed";
  source?: Candidate["source"];
  mediaId?: number;
  imageUrl?: string;
  pageUrl?: string;
  license?: Candidate["license"];
  filesize?: number;
  reason?: string;
};

const userAgent =
  "IrhalMediaEnrichment/1.0 (+https://irhal.com; editorial media review)";
const verificationDate = "2026-05-30";
const tmpDir = path.join(os.tmpdir(), "irhal-karachi-guide-media");
const reportPath = path.join(process.cwd(), "tmp", "karachi-guide-media-report.json");

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const irhalOnly = args.has("--irhal-only");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;
const kindArg = process.argv.find((arg) => arg.startsWith("--kind="));
const selectedKind = kindArg?.split("=")[1];
const slugArg = process.argv.find((arg) => arg.startsWith("--slug="));
const selectedSlugs = slugArg
  ?.split("=")[1]
  ?.split(",")
  .map((slug) => slug.trim())
  .filter(Boolean);

const commonsHints = new Map<string, string>([
  ["abdullah-shah-ghazi-shrine", "Abdullah Shah Ghazi mausoleum Karachi"],
  ["bagh-ibn-e-qasim", "Bagh Ibn-e-Qasim Karachi"],
  ["bahadurabad-char-minar", "Bahadurabad Char Minar Karachi"],
  ["boulton-market", "Boulton Market Karachi"],
  ["burns-road-food-street", "Burns Road Karachi"],
  ["cape-monze", "Cape Monze Karachi"],
  ["charna-island", "Charna Island Karachi"],
  ["chaukhandi-tombs", "Chaukhandi tombs Karachi"],
  ["clifton-beach-sea-view", "Clifton Beach Karachi"],
  ["custom-house-karachi", "Custom House Karachi"],
  ["denso-hall", "Denso Hall Karachi"],
  ["do-darya", "Do Darya Karachi"],
  ["empress-market", "Empress Market Karachi"],
  ["french-beach", "French Beach Karachi"],
  ["grand-jamia-mosque-bahria-town", "Grand Jamia Mosque Bahria Town Karachi"],
  ["hawksbay-beach", "Hawke's Bay Beach Karachi"],
  ["hindu-gymkhana-napa", "Hindu Gymkhana Karachi"],
  ["i-i-chundrigar-road", "I. I. Chundrigar Road Karachi"],
  ["jahangir-park", "Jahangir Park Karachi"],
  ["karachi-port-trust-building", "Karachi Port Trust Building"],
  ["karachi-war-cemetery", "Karachi War Cemetery"],
  ["karachi-zoo", "Karachi Zoo"],
  ["keamari-harbour-front", "Keamari Harbour Karachi"],
  ["keanjhar-lake", "Keenjhar Lake Sindh"],
  ["keenjhar-lake", "Keenjhar Lake Sindh"],
  ["khaliq-dina-hall", "Khaliq Dina Hall Karachi"],
  ["kmc-building", "Karachi Metropolitan Corporation Building"],
  ["manghopir-crocodile-pond", "Manghopir crocodile pond Karachi"],
  ["manghopir-shrine", "Manghopir shrine Karachi"],
  ["manora-island-peninsula", "Manora Karachi"],
  ["manora-lighthouse", "Manora Lighthouse Karachi"],
  ["masjid-e-tooba", "Tooba Mosque Karachi"],
  ["masjid-e-tooba-gol-masjid", "Tooba Mosque Karachi"],
  ["memon-masjid", "New Memon Masjid Karachi"],
  ["bait-ul-mukarram-masjid", "Baitul Mukarram Mosque Karachi"],
  ["grand-jamia-masjid-bahria-town-karachi", "Grand Jamia Mosque Bahria Town Karachi"],
  ["jamia-masjid-bahria-town-karachi", "Grand Jamia Mosque Bahria Town Karachi"],
  ["merewether-clock-tower", "Merewether Clock Tower Karachi"],
  ["mubarak-village", "Mubarak Village Karachi"],
  ["national-stadium-karachi", "National Stadium Karachi"],
  ["native-jetty-bridge", "Native Jetty Bridge Karachi"],
  ["paf-museum", "Pakistan Air Force Museum Karachi"],
  ["pakistan-chowk", "Pakistan Chowk Karachi"],
  ["pakistan-maritime-museum", "Pakistan Maritime Museum Karachi"],
  ["quaid-e-azam-house-museum", "Quaid-e-Azam House Karachi"],
  ["sandspit-beach", "Sandspit Beach Karachi"],
  ["shah-jahan-mosque-thatta", "Shah Jahan Mosque Thatta"],
  ["state-bank-museum", "State Bank Museum Karachi"],
  ["thatta-and-makli-day-trip", "Makli Necropolis Thatta"],
  ["turtle-beach-karachi", "Turtle Beach Karachi"],
  ["wazir-mansion", "Wazir Mansion Karachi"],
]);

const exactCommonsFiles = new Map<string, string>([
  ["quaid-e-azam-house-museum", "File:Quaid-e-Azam_House_Karachi.jpg"],
  ["wazir-mansion", "File:Wazir_Mansion,_Kharadar_11.jpg"],
]);

const disallowedImageFragments = [
  "irhal_splash_logo",
  "2305734-e1660650853201",
  "image_irhal_cities_general_muslim-information_mosque",
  "icon_",
  "logo",
  "sprite",
  "placeholder",
];

function usage() {
  if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
    throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
  }
}

function normalizeUrl(url: string, base?: string) {
  const clean = url
    .replace(/&amp;/g, "&")
    .replace(/^content=["']?/, "")
    .replace(/^media=/, "")
    .replace(/^['"]|['"],?$/g, "")
    .trim();

  return new URL(clean, base).toString();
}

function decodeHtml(value?: string) {
  return (value || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function safeFilename(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function tokenScore(title: string, haystack: string) {
  const tokens = title
    .toLowerCase()
    .replace(/karachi|pakistan|the|and|of|e|al|legacy|site|view/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  if (tokens.length === 0) return 0;
  const hay = haystack.toLowerCase();
  const matches = tokens.filter((token) => hay.includes(token)).length;
  return matches / tokens.length;
}

async function fetchWithRetry(url: string, timeoutMs = 25_000) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": userAgent },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status)) {
        return response;
      }

      lastError = new Error(`fetch failed ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1_200));
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function fetchBuffer(url: string) {
  const response = await fetchWithRetry(url);

  if (!response.ok) {
    throw new Error(`fetch failed ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.startsWith("image/")) {
    throw new Error(`not an image (${contentType || "unknown content-type"})`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function fetchText(url: string) {
  const response = await fetchWithRetry(url);

  return response.text();
}

function extractIrhalImage(html: string, pageUrl: string) {
  const urls = new Set<string>();
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /https?:\/\/[^"'\s<>]+wp-content\/uploads\/[^"'\s<>]+?\.(?:jpe?g|png|webp)/gi,
    /media=(https?%3A%2F%2F[^"'\s<>]+)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of html.matchAll(pattern)) {
      const raw = match[1] || match[0];
      const decoded = raw.includes("%2F") ? decodeURIComponent(raw) : raw;
      try {
        urls.add(normalizeUrl(decoded, pageUrl));
      } catch {
        // Ignore malformed scraped URLs.
      }
    }
  }

  const ranked = [...urls]
    .filter((url) => !disallowedImageFragments.some((part) => url.toLowerCase().includes(part)))
    .filter((url) => !/-\d+x\d+\.(jpe?g|png|webp)$/i.test(url))
    .sort((a, b) => {
      const aScore = a.includes("image_stories") ? 2 : a.includes("wp-content/uploads") ? 1 : 0;
      const bScore = b.includes("image_stories") ? 2 : b.includes("wp-content/uploads") ? 1 : 0;
      return bScore - aScore || a.length - b.length;
    });

  return ranked[0];
}

async function getIrhalCandidate(item: GuideItemRow): Promise<Candidate | null> {
  const source = item.sources.find((row) => row.url?.startsWith("https://irhal.com/"));
  if (!source?.url) return null;

  const html = await fetchText(source.url);
  const imageUrl = extractIrhalImage(html, source.url);
  if (!imageUrl) return null;

  return {
    source: "irhal",
    imageUrl,
    pageUrl: source.url,
    license: "owned",
    usageStatus: "approved",
    attribution: `Irhal.com (${source.label || item.title})`,
    confidence: "high",
    notes: `Sourced from the existing Irhal legacy page and verified ${verificationDate}.`,
  };
}

function mapCommonsLicense(
  extmetadata: Record<string, { value?: string }> = {},
): Candidate["license"] | null {
  const licenseShortName = decodeHtml(extmetadata.LicenseShortName?.value);
  const usageTerms = decodeHtml(extmetadata.UsageTerms?.value);
  const license = `${licenseShortName} ${usageTerms}`.toLowerCase();

  if (license.includes("public domain") || license.includes("pd-")) {
    return "public-domain" as const;
  }

  if (license.includes("cc") || license.includes("creative commons")) {
    return "creative-commons" as const;
  }

  return null;
}

function hasExpectedLocation(search: string, haystack: string) {
  const query = search.toLowerCase();
  const text = haystack.toLowerCase();

  if (query.includes("thatta") || query.includes("makli")) {
    return text.includes("thatta") || text.includes("makli") || text.includes("sindh");
  }

  if (query.includes("keenjhar")) {
    return text.includes("keenjhar") || text.includes("kalri") || text.includes("sindh");
  }

  if (query.includes("wazir mansion")) {
    return text.includes("wazir mansion") && (text.includes("kharadar") || text.includes("karachi"));
  }

  if (query.includes("karachi")) {
    return text.includes("karachi");
  }

  return true;
}

async function getWikidataImageTitle(search: string) {
  const searchUrl = new URL("https://www.wikidata.org/w/api.php");
  searchUrl.search = new URLSearchParams({
    action: "wbsearchentities",
    search,
    language: "en",
    limit: "5",
    format: "json",
    origin: "*",
  }).toString();

  const searchResponse = await fetchWithRetry(searchUrl.toString(), 8_000);
  if (!searchResponse.ok) return null;

  const searchJson = (await searchResponse.json()) as {
    search?: Array<{ id?: string; label?: string; description?: string }>;
  };

  const entity = (searchJson.search || []).find((result) =>
    hasExpectedLocation(search, `${result.label || ""} ${result.description || ""}`),
  );
  if (!entity?.id) return null;

  const entityUrl = new URL("https://www.wikidata.org/w/api.php");
  entityUrl.search = new URLSearchParams({
    action: "wbgetentities",
    ids: entity.id,
    props: "claims",
    format: "json",
    origin: "*",
  }).toString();

  const entityResponse = await fetchWithRetry(entityUrl.toString(), 8_000);
  if (!entityResponse.ok) return null;

  const entityJson = (await entityResponse.json()) as {
    entities?: Record<
      string,
      {
        claims?: {
          P18?: Array<{
            mainsnak?: {
              datavalue?: { value?: string };
            };
          }>;
        };
      }
    >;
  };

  const filename = entityJson.entities?.[entity.id]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  return filename ? `File:${filename}` : null;
}

async function getCommonsFileCandidate(
  imageTitle: string,
  search: string,
  score: number,
): Promise<Candidate | null> {
  const imageInfoUrl = new URL("https://en.wikipedia.org/w/api.php");
  imageInfoUrl.search = new URLSearchParams({
    action: "query",
    titles: imageTitle,
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  }).toString();

  const imageResponse = await fetchWithRetry(imageInfoUrl.toString(), 8_000);
  if (!imageResponse.ok) {
    throw new Error(`wikimedia image metadata failed ${imageResponse.status}`);
  }

  const imageJson = (await imageResponse.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            url?: string;
            thumburl?: string;
            mime?: string;
            width?: number;
            height?: number;
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
          }>;
        }
      >;
    };
  };

  const info = Object.values(imageJson.query?.pages || {})[0]?.imageinfo?.[0];
  const ext = info?.extmetadata || {};
  const license = mapCommonsLicense(ext);
  if (!info?.descriptionurl || !info.mime?.startsWith("image/") || !license) return null;

  const imageUrl = info.thumburl || info.url;
  if (!imageUrl) return null;

  const fileHaystack = [
    imageTitle,
    info.descriptionurl,
    decodeHtml(ext.ObjectName?.value),
    decodeHtml(ext.ImageDescription?.value),
    decodeHtml(ext.Categories?.value),
  ].join(" ");
  if (!hasExpectedLocation(search, fileHaystack)) return null;

  const artist = decodeHtml(ext.Artist?.value);
  const credit = decodeHtml(ext.Credit?.value);
  const licenseShortName = decodeHtml(ext.LicenseShortName?.value);
  const attribution = [artist || credit || "Wikimedia Commons contributor", licenseShortName]
    .filter(Boolean)
    .join(", ");

  return {
    source: "commons",
    imageUrl,
    pageUrl: info.descriptionurl,
    license,
    usageStatus: "draft",
    attribution,
    photographer: artist || undefined,
    width: info.width,
    height: info.height,
    confidence: score > 0.7 ? "high" : "medium",
    notes: `Creative-license candidate from Wikimedia Commons, verified ${verificationDate}; requires editorial attribution review before approval.`,
  };
}

async function getCommonsCandidate(item: GuideItemRow): Promise<Candidate | null> {
  if (!["place", "masjid", "shopping", "family"].includes(item.kind)) return null;

  const search = commonsHints.get(item.slug);
  if (!search) return null;
  if (irhalOnly) return null;

  const exactFile = exactCommonsFiles.get(item.slug);
  if (exactFile) {
    const exactCandidate = await getCommonsFileCandidate(exactFile, search, 1);
    if (exactCandidate) return exactCandidate;
  }

  const apiUrl = new URL("https://en.wikipedia.org/w/api.php");
  apiUrl.search = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: search,
    gsrnamespace: "0",
    gsrlimit: "5",
    prop: "pageimages|images",
    pithumbsize: "1600",
    imlimit: "12",
    redirects: "1",
    format: "json",
    origin: "*",
  }).toString();

  const response = await fetchWithRetry(apiUrl.toString(), 8_000);
  if (!response.ok) {
    throw new Error(`wikimedia search failed ${response.status}`);
  }

  const json = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          pageimage?: string;
          thumbnail?: { source?: string; width?: number; height?: number };
          images?: Array<{ title?: string }>;
        }
      >;
    };
  };

  const pages = Object.values(json.query?.pages || {});
  const rankedArticles = pages
    .map((page) => {
      const imageTitle =
        page.pageimage ? `File:${page.pageimage}` : page.images?.find((image) => {
          const title = image.title || "";
          return !/(\.svg|logo|icon|symbol|map)/i.test(title);
        })?.title;

      return {
        imageTitle,
        score: tokenScore(search, `${page.title || ""} ${imageTitle || ""}`),
      };
    })
    .filter((candidate): candidate is { imageTitle: string; score: number } =>
      Boolean(candidate.imageTitle && candidate.score >= 0.35),
    )
    .sort((a, b) => b.score - a.score);

  const bestArticle = rankedArticles[0];
  if (bestArticle) {
    const candidate = await getCommonsFileCandidate(
      bestArticle.imageTitle,
      search,
      bestArticle.score,
    );
    if (candidate) return candidate;
  }

  const wikidataImageTitle = await getWikidataImageTitle(search);
  return wikidataImageTitle
    ? getCommonsFileCandidate(wikidataImageTitle, search, 0.8)
    : null;
}

async function prepareUpload(item: GuideItemRow, candidate: Candidate) {
  await fs.mkdir(tmpDir, { recursive: true });
  const sourceBuffer = await fetchBuffer(candidate.imageUrl);
  const outputPath = path.join(
    tmpDir,
    `${safeFilename(`${item.kind}-${item.slug}`)}.webp`,
  );

  await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: 1200,
      height: 820,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({
      effort: 6,
      quality: candidate.source === "irhal" ? 52 : 50,
      smartSubsample: true,
    })
    .toFile(outputPath);

  const stat = await fs.stat(outputPath);
  return { outputPath, filesize: stat.size };
}

async function findExistingMedia(db: InstanceType<typeof Client>, candidate: Candidate) {
  const existing = await db.query(
    `
      select id
      from payload.media
      where source_url = $1
        and coalesce(usage_notes, '') like $2
        and coalesce(usage_status::text, '') <> 'needs-replacement'
      order by id desc
      limit 1
    `,
    [candidate.pageUrl, `%Original image: ${candidate.imageUrl}%`],
  );

  return existing.rows[0]?.id ? Number(existing.rows[0].id) : null;
}

async function main() {
  usage();
  await fs.mkdir(path.dirname(reportPath), { recursive: true });

  const payload = await getPayload({ config });
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();

  const report: ReportRow[] = [];

  try {
    const result = await db.query(
      `
        select gi.id, gi.kind, gi.title, gi.slug, gi.image_id, gi.area, gi.category,
               coalesce(json_agg(json_build_object(
                 'label', gis.label,
                 'url', gis.url,
                 'type', gis.type,
                 'confidence', gis.confidence
               ) order by gis._order) filter (where gis.id is not null), '[]') as sources
        from payload.guide_items gi
        left join payload.guide_items_sources gis on gis._parent_id = gi.id
        where gi.image_id is null
          and gi.city_id = (select id from payload.cities where slug = 'karachi')
          and ($1::text is null or gi.kind::text = $1::text)
          and ($2::text[] is null or gi.slug = any($2::text[]))
        group by gi.id
        order by
          case when exists (
            select 1 from payload.guide_items_sources source
            where source._parent_id = gi.id and source.url like 'https://irhal.com/%'
          ) then 0 else 1 end,
          gi.title
      `,
      [selectedKind || null, selectedSlugs?.length ? selectedSlugs : null],
    );

    const items = (result.rows as GuideItemRow[]).slice(0, limit);
    console.log(
      `Karachi guide images: processing ${items.length} missing items${selectedKind ? ` (${selectedKind})` : ""}`,
    );

    for (const item of items) {
      try {
        const candidate =
          (await getIrhalCandidate(item)) || (await getCommonsCandidate(item));

        if (!candidate) {
          report.push({
            kind: item.kind,
            slug: item.slug,
            title: item.title,
            status: "skipped",
            reason: "No high-confidence Irhal or Commons image candidate found.",
          });
          console.log(`skip ${item.kind}:${item.slug}: no candidate`);
          continue;
        }

        const existingMediaId = await findExistingMedia(db, candidate);
        if (dryRun) {
          report.push({
            kind: item.kind,
            slug: item.slug,
            title: item.title,
            status: "linked",
            source: candidate.source,
            mediaId: existingMediaId || undefined,
            imageUrl: candidate.imageUrl,
            pageUrl: candidate.pageUrl,
            license: candidate.license,
            reason: "dry-run candidate",
          });
          console.log(`dry-run ${item.kind}:${item.slug}: ${candidate.source} ${candidate.pageUrl}`);
          continue;
        }

        let mediaId = existingMediaId;
        let filesize: number | undefined;

        if (!mediaId) {
          const upload = await prepareUpload(item, candidate);
          filesize = upload.filesize;
          const created = (await payload.create({
            collection: "media" as never,
            filePath: upload.outputPath,
            data: {
              alt: `${item.title}, Karachi`,
              caption: candidate.notes,
              attribution: candidate.attribution,
              photographer: candidate.photographer,
              sourceUrl: candidate.pageUrl,
              license: candidate.license,
              usageStatus: candidate.usageStatus,
              usageNotes: `${candidate.notes}\nOriginal image: ${candidate.imageUrl}`,
            } as never,
            overrideAccess: true,
          })) as { id: number | string };
          mediaId = Number(created.id);
        }

        await db.query(
          `update payload.guide_items
           set image_id = $1, image_alt = $2, updated_at = now()
           where id = $3`,
          [mediaId, `${item.title}, Karachi`, item.id],
        );

        report.push({
          kind: item.kind,
          slug: item.slug,
          title: item.title,
          status: "linked",
          source: candidate.source,
          mediaId,
          imageUrl: candidate.imageUrl,
          pageUrl: candidate.pageUrl,
          license: candidate.license,
          filesize,
        });
        console.log(`linked ${item.kind}:${item.slug} -> media #${mediaId} (${candidate.source})`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        report.push({
          kind: item.kind,
          slug: item.slug,
          title: item.title,
          status: "failed",
          reason: message,
        });
        console.warn(`failed ${item.kind}:${item.slug}: ${message}`);
      }
    }

    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    const summary = await db.query(
      `select count(*)::int as total, count(image_id)::int as with_image
       from payload.guide_items
       where city_id = (select id from payload.cities where slug = 'karachi')
         and ($1::text is null or kind::text = $1::text)`,
      [selectedKind || null],
    );
    console.log("Karachi guide image summary:", summary.rows[0]);
    console.log(`Report: ${reportPath}`);
  } finally {
    await db.end();
  }
}

await main();
process.exit(0);
