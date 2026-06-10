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
  area: string | null;
  category: string | null;
  id: number;
  image_id: number | null;
  kind: string;
  slug: string;
  title: string;
};

type Candidate = {
  attribution: string;
  confidence: "high" | "medium";
  imageUrl: string;
  license: "creative-commons" | "public-domain";
  pageUrl: string;
  photographer?: string;
  usageNotes: string;
};

type ReportRow = {
  imageUrl?: string;
  kind: string;
  license?: Candidate["license"];
  mediaId?: number;
  pageUrl?: string;
  reason?: string;
  slug: string;
  status: "linked" | "skipped" | "failed";
  title: string;
};

const userAgent =
  "IrhalLondonMediaEnrichment/1.0 (+https://irhal.com; editorial media review)";
const tmpDir = path.join(os.tmpdir(), "irhal-london-guide-media");
const reportPath = path.join(process.cwd(), "tmp", "london-guide-media-report.json");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Number.POSITIVE_INFINITY;
const kindArg = process.argv.find((arg) => arg.startsWith("--kind="));
const selectedKind = kindArg?.split("=")[1];

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const decodeHtml = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const safeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const tokens = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
      .filter(
        (token) =>
          ![
            "and",
            "the",
            "london",
            "united",
            "kingdom",
            "restaurant",
            "hotel",
            "mosque",
            "masjid",
          ].includes(token),
      ),
  );

const tokenScore = (query: string, candidate: string) => {
  const queryTokens = tokens(query);
  if (queryTokens.size === 0) return 0;
  const candidateText = candidate.toLowerCase();
  let matches = 0;
  for (const token of queryTokens) {
    if (candidateText.includes(token)) matches += 1;
  }
  return matches / queryTokens.size;
};

const mapCommonsLicense = (
  extmetadata: Record<string, { value?: string }> = {},
): Candidate["license"] | null => {
  const licenseShortName = decodeHtml(extmetadata.LicenseShortName?.value);
  const usageTerms = decodeHtml(extmetadata.UsageTerms?.value);
  const license = `${licenseShortName} ${usageTerms}`.toLowerCase();

  if (license.includes("public domain") || license.includes("pd-")) {
    return "public-domain";
  }
  if (license.includes("cc") || license.includes("creative commons")) {
    return "creative-commons";
  }
  return null;
};

const fetchWithRetry = async (url: string, timeoutMs = 12_000, attempts = 2) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return response;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  throw lastError;
};

const fetchBuffer = async (url: string) => {
  const response = await fetchWithRetry(url, 30_000, 3);
  if (!response.ok) throw new Error(`image download failed ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const commonsSearch = async (search: string) => {
  const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
  apiUrl.search = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: search,
    gsrnamespace: "6",
    gsrlimit: "8",
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    iiurlwidth: "1600",
    format: "json",
    origin: "*",
  }).toString();

  const response = await fetchWithRetry(apiUrl.toString());
  if (!response.ok) throw new Error(`commons search failed ${response.status}`);

  const json = (await response.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          imageinfo?: Array<{
            descriptionurl?: string;
            extmetadata?: Record<string, { value?: string }>;
            height?: number;
            mime?: string;
            thumburl?: string;
            url?: string;
            width?: number;
          }>;
          title?: string;
        }
      >;
    };
  };

  return Object.values(json.query?.pages || {});
};

const getCommonsCandidate = async (item: GuideItemRow): Promise<Candidate | null> => {
  const search = `${item.title} ${item.area || ""} London`;
  const pages = await commonsSearch(search);
  const ranked = pages
    .map((page) => {
      const info = page.imageinfo?.[0];
      const ext = info?.extmetadata || {};
      const license = mapCommonsLicense(ext);
      const title = page.title || "";
      const objectName = decodeHtml(ext.ObjectName?.value);
      const description = decodeHtml(ext.ImageDescription?.value);
      const categories = decodeHtml(ext.Categories?.value);
      const haystack = `${title} ${objectName} ${description} ${categories} ${info?.descriptionurl || ""}`;
      const score = tokenScore(search, haystack);
      return { ext, haystack, info, license, score, title };
    })
    .filter((candidate) => {
      const title = candidate.title.toLowerCase();
      const mime = candidate.info?.mime || "";
      if (!candidate.info?.descriptionurl || !candidate.info?.thumburl) return false;
      if (!mime.startsWith("image/")) return false;
      if (!candidate.license) return false;
      if (/(\.svg|logo|icon|map|diagram|plan|seal)/i.test(title)) return false;
      if ((candidate.info.width || 0) < 700 || (candidate.info.height || 0) < 450) {
        return false;
      }
      return candidate.score >= 0.45 || candidate.haystack.toLowerCase().includes("london");
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best?.info?.thumburl || !best.info.descriptionurl || !best.license) {
    return null;
  }

  const artist = decodeHtml(best.ext.Artist?.value);
  const credit = decodeHtml(best.ext.Credit?.value);
  const licenseShortName = decodeHtml(best.ext.LicenseShortName?.value);
  const attribution = [artist || credit || "Wikimedia Commons contributor", licenseShortName]
    .filter(Boolean)
    .join(", ");

  return {
    attribution,
    confidence: best.score >= 0.7 ? "high" : "medium",
    imageUrl: best.info.thumburl,
    license: best.license,
    pageUrl: best.info.descriptionurl,
    photographer: artist || undefined,
    usageNotes: `Wikimedia Commons candidate for ${item.title}, London. License metadata: ${licenseShortName}. Original image: ${best.info.url || best.info.thumburl}`,
  };
};

const findExistingMedia = async (
  db: InstanceType<typeof Client>,
  candidate: Candidate,
) => {
  const existing = await db.query(
    `
      select id
      from payload.media
      where source_url = $1
        and coalesce(usage_status::text, '') <> 'needs-replacement'
      order by id desc
      limit 1
    `,
    [candidate.pageUrl],
  );

  return existing.rows[0]?.id ? Number(existing.rows[0].id) : null;
};

const prepareUpload = async (item: GuideItemRow, candidate: Candidate) => {
  await fs.mkdir(tmpDir, { recursive: true });
  const sourceBuffer = await fetchBuffer(candidate.imageUrl);
  const outputPath = path.join(
    tmpDir,
    `${safeFilename(`${item.kind}-${item.slug}`)}.webp`,
  );

  await sharp(sourceBuffer)
    .rotate()
    .resize({ fit: "inside", height: 820, width: 1200, withoutEnlargement: true })
    .webp({ effort: 6, quality: 50, smartSubsample: true })
    .toFile(outputPath);

  return outputPath;
};

const main = async () => {
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
        select gi.id, gi.kind, gi.title, gi.slug, gi.image_id, gi.area, gi.category
        from payload.guide_items gi
        where gi.city_id = (select id from payload.cities where slug = 'london')
          and gi.image_id is null
          and ($1::text is null or gi.kind::text = $1::text)
        order by
          case gi.kind
            when 'place' then 0
            when 'masjid' then 1
            when 'shopping' then 2
            when 'family' then 3
            when 'hotel' then 4
            when 'tour' then 5
            else 6
          end,
          gi.title
      `,
      [selectedKind || null],
    );

    const items = (result.rows as GuideItemRow[]).slice(0, limit);
    console.log(
      `London guide media: processing ${items.length} missing items${selectedKind ? ` (${selectedKind})` : ""}${dryRun ? " dry-run" : ""}`,
    );

    for (const item of items) {
      try {
        const candidate = await getCommonsCandidate(item);
        if (!candidate) {
          report.push({
            kind: item.kind,
            reason: "No acceptable Wikimedia Commons candidate found.",
            slug: item.slug,
            status: "skipped",
            title: item.title,
          });
          console.log(`skip ${item.kind}:${item.slug}`);
          continue;
        }

        const existingMediaId = await findExistingMedia(db, candidate);
        if (dryRun) {
          report.push({
            imageUrl: candidate.imageUrl,
            kind: item.kind,
            license: candidate.license,
            mediaId: existingMediaId || undefined,
            pageUrl: candidate.pageUrl,
            slug: item.slug,
            status: "linked",
            title: item.title,
          });
          console.log(`dry-run ${item.kind}:${item.slug} -> ${candidate.pageUrl}`);
          continue;
        }

        let mediaId = existingMediaId;
        if (!mediaId) {
          const outputPath = await prepareUpload(item, candidate);
          const created = (await payload.create({
            collection: "media" as never,
            filePath: outputPath,
            data: {
              alt: `${item.title}, London`,
              attribution: candidate.attribution,
              caption: `${item.title}, London. Source: Wikimedia Commons.`,
              license: candidate.license,
              photographer: candidate.photographer,
              sourceUrl: candidate.pageUrl,
              usageNotes: candidate.usageNotes,
              usageStatus: "draft",
            } as never,
            overrideAccess: true,
          })) as { id: number | string };
          mediaId = Number(created.id);
        }

        await db.query(
          `update payload.guide_items
           set image_id = $1, image_alt = $2, updated_at = now()
           where id = $3`,
          [mediaId, `${item.title}, London`, item.id],
        );

        report.push({
          imageUrl: candidate.imageUrl,
          kind: item.kind,
          license: candidate.license,
          mediaId,
          pageUrl: candidate.pageUrl,
          slug: item.slug,
          status: "linked",
          title: item.title,
        });
        console.log(`linked ${item.kind}:${item.slug} -> media #${mediaId}`);
      } catch (error) {
        report.push({
          kind: item.kind,
          reason: error instanceof Error ? error.message : String(error),
          slug: item.slug,
          status: "failed",
          title: item.title,
        });
        console.warn(`failed ${item.kind}:${item.slug}`, error);
      }
    }
  } finally {
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
    await db.end();
  }

  const summary = report.reduce<Record<string, number>>((counts, row) => {
    counts[row.status] = (counts[row.status] || 0) + 1;
    return counts;
  }, {});
  console.log(`London media report: ${JSON.stringify(summary)} -> ${reportPath}`);
};

await main();
process.exit(0);
