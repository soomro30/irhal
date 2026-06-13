import nextEnv from "@next/env";
import { randomUUID } from "node:crypto";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");
process.env.IRHAL_SKIP_PAYLOAD_HOOK_REVALIDATE = "true";

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

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

type CommonsAsset = {
  alt: string;
  caption: string;
  commonsTitle: string;
  outputBase: string;
  slug: string;
};

type CommonsInfo = {
  descriptionurl: string;
  extmetadata?: Record<string, { value?: string }>;
  height: number;
  mime: string;
  url: string;
  width: number;
};

const verifiedAt = "2026-06-13T00:00:00.000Z";
const tmpDir = path.join(os.tmpdir(), "irhal-london-restaurant-media");
const reportPath = path.resolve(
  process.cwd(),
  "tmp/london-restaurant-media-report.json",
);
const userAgent =
  "IrhalLondonRestaurantMediaImport/1.0 (+https://irhal.com; editorial media review)";

const existingMediaLinks = [
  {
    slug: "khan-s-of-kensington",
    sourceMediaFilename: "khan-s-restaurant.webp",
    alt: "Khan's of Kensington restaurant in London",
  },
];

const commonsAssets: CommonsAsset[] = [
  {
    slug: "veeraswamy",
    commonsTitle: "File:Veeraswamy 2008 07 01.jpg",
    outputBase: "london-restaurant-veeraswamy-regent-street-commons",
    alt: "Veeraswamy restaurant on Regent Street in London",
    caption: "Veeraswamy restaurant on Regent Street, London.",
  },
  {
    slug: "le-gavroche",
    commonsTitle: "File:Le Gavroche 2008 06 19.jpg",
    outputBase: "london-restaurant-le-gavroche-mayfair-commons",
    alt: "Le Gavroche restaurant in Mayfair, London",
    caption: "Le Gavroche restaurant in Mayfair, London.",
  },
  {
    slug: "the-ivy",
    commonsTitle: "File:The Ivy Restaurant, West Street, London.jpg",
    outputBase: "london-restaurant-the-ivy-west-street-daniel-cahen-commons",
    alt: "The Ivy restaurant on West Street in London",
    caption: "The Ivy restaurant on West Street, London.",
  },
  {
    slug: "comptoir-libanais-south-kensington",
    commonsTitle: "File:Comptoir Libanais.jpg",
    outputBase: "london-restaurant-comptoir-libanais-south-kensington-commons",
    alt: "Comptoir Libanais South Kensington on Exhibition Road",
    caption: "Comptoir Libanais South Kensington on Exhibition Road, London.",
  },
  {
    slug: "saravanaa-bhavan",
    commonsTitle: "File:Saravanaa Bhavan, East Ham, London (3766490911).jpg",
    outputBase: "london-restaurant-saravanaa-bhavan-east-ham-commons",
    alt: "South Indian food at Saravanaa Bhavan East Ham in London",
    caption: "Idly sambar served at Saravanaa Bhavan, East Ham, London.",
  },
  {
    slug: "gourmet-burger-kitchen",
    commonsTitle: "File:Gourmet Burger Kitchen hamburger.jpg",
    outputBase: "london-restaurant-gourmet-burger-kitchen-hamburger-commons",
    alt: "Burger served at Gourmet Burger Kitchen in London",
    caption: "A burger served at Gourmet Burger Kitchen in London.",
  },
  {
    slug: "gordon-ramsay",
    commonsTitle:
      "File:Eu já comi duas vezes o ravioli de frutos do mar que é um prato-assinatura do Gordon Ramsay at Royal Hospital Road (26672111050).jpg",
    outputBase: "london-restaurant-gordon-ramsay-royal-hospital-road-commons",
    alt: "Crab ravioli at Restaurant Gordon Ramsay in London",
    caption:
      "A crab ravioli dish photographed at Restaurant Gordon Ramsay, Royal Hospital Road.",
  },
];

const decodeHtml = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const extensionForMime = (mime: string) => {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
};

const fetchWithRetry = async (url: string, attempts = 3) => {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": userAgent },
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  throw lastError;
};

const commonsInfo = async (title: string): Promise<CommonsInfo> => {
  const apiUrl = new URL("https://commons.wikimedia.org/w/api.php");
  apiUrl.search = new URLSearchParams({
    action: "query",
    titles: title,
    prop: "imageinfo",
    iiprop: "url|mime|size|extmetadata",
    format: "json",
    origin: "*",
  }).toString();

  const response = await fetchWithRetry(apiUrl.toString());
  const json = (await response.json()) as {
    query?: {
      pages?: Record<string, { imageinfo?: CommonsInfo[] }>;
    };
  };
  const info = Object.values(json.query?.pages ?? {})[0]?.imageinfo?.[0];
  if (!info?.url || !info.descriptionurl) {
    throw new Error(`Commons image info not found for ${title}`);
  }
  return info;
};

const attributionFrom = (info: CommonsInfo) => {
  const ext = info.extmetadata ?? {};
  const artist = decodeHtml(ext.Artist?.value);
  const credit = decodeHtml(ext.Credit?.value);
  const attribution = decodeHtml(ext.Attribution?.value);
  return attribution || artist || credit || "Wikimedia Commons contributor";
};

const licenseFrom = (info: CommonsInfo) => {
  const ext = info.extmetadata ?? {};
  return (
    decodeHtml(ext.LicenseShortName?.value) ||
    decodeHtml(ext.UsageTerms?.value) ||
    "Creative Commons"
  );
};

const usageNotes = (asset: CommonsAsset, info: CommonsInfo) =>
  [
    `Imported for London restaurant guide item ${asset.slug}.`,
    `Commons file: ${asset.commonsTitle}.`,
    `Source page: ${info.descriptionurl}.`,
    `License: ${licenseFrom(info)}.`,
    "Imported through Payload; webp derivatives generated for public cards.",
  ].join(" ");

const download = async (url: string, filePath: string) => {
  const response = await fetchWithRetry(url);
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
};

const getItem = async (db: InstanceType<typeof Client>, slug: string) => {
  const result = await db.query(
    `select id, title, image_id
       from payload.guide_items
      where city_id = (select id from payload.cities where slug = 'london')
        and kind = 'restaurant'
        and slug = $1
      limit 1`,
    [slug],
  );
  return result.rows[0] as
    | { id: number; image_id: number | null; title: string }
    | undefined;
};

const setPrimaryImage = async (
  db: InstanceType<typeof Client>,
  itemId: number,
  mediaId: number,
  alt: string,
) => {
  await db.query(
    `update payload.guide_items
        set image_id = $1,
            image_alt = $2,
            updated_at = now()
      where id = $3`,
    [mediaId, alt, itemId],
  );
};

const addSourceRow = async (
  db: InstanceType<typeof Client>,
  itemId: number,
  label: string,
  url: string,
) => {
  const existing = await db.query(
    `select id
       from payload.guide_items_sources
      where _parent_id = $1 and url = $2
      limit 1`,
    [itemId, url],
  );
  if (existing.rows.length > 0) return;

  const order = await db.query(
    `select coalesce(max(_order), -1) + 1 as next_order
       from payload.guide_items_sources
      where _parent_id = $1`,
    [itemId],
  );
  await db.query(
    `insert into payload.guide_items_sources
       (_parent_id, _order, id, label, url, type, verified_at, confidence)
     values ($1, $2, $3, $4, $5, 'editorial', $6, 'high')`,
    [
      itemId,
      Number(order.rows[0]?.next_order ?? 0),
      randomUUID(),
      label,
      url,
      verifiedAt,
    ],
  );
};

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("supabase")
    ? { rejectUnauthorized: false }
    : undefined,
});
await db.connect();
await fs.mkdir(tmpDir, { recursive: true });

const payload = await getPayload({ config });
const report: unknown[] = [];

try {
  for (const link of existingMediaLinks) {
    const item = await getItem(db, link.slug);
    if (!item) throw new Error(`Missing restaurant ${link.slug}`);

    const media = await db.query(
      `select id, source_url
         from payload.media
        where filename = $1
        limit 1`,
      [link.sourceMediaFilename],
    );
    const mediaId = Number(media.rows[0]?.id);
    if (!mediaId) throw new Error(`Missing media ${link.sourceMediaFilename}`);

    await setPrimaryImage(db, Number(item.id), mediaId, link.alt);
    await addSourceRow(
      db,
      Number(item.id),
      `${item.title} image source`,
      String(media.rows[0]?.source_url ?? "Irhal legacy editorial archive"),
    );
    report.push({
      mediaId,
      slug: link.slug,
      source: link.sourceMediaFilename,
      status: "linked-existing",
    });
    console.log(`linked existing #${mediaId} -> ${link.slug}`);
  }

  for (const asset of commonsAssets) {
    const item = await getItem(db, asset.slug);
    if (!item) throw new Error(`Missing restaurant ${asset.slug}`);

    const info = await commonsInfo(asset.commonsTitle);
    const filename = `${asset.outputBase}.${extensionForMime(info.mime)}`;
    const filePath = path.join(tmpDir, filename);
    await download(info.url, filePath);

    const existing = await db.query(
      `select id
         from payload.media
        where filename like $1
        order by id desc
        limit 1`,
      [`${asset.outputBase}%`],
    );
    let mediaId = existing.rows[0]?.id ? Number(existing.rows[0].id) : undefined;
    const attribution = attributionFrom(info);
    const license = licenseFrom(info);
    const data = {
      alt: asset.alt,
      attribution,
      caption: asset.caption,
      license: "creative-commons",
      photographer: attribution,
      sourceUrl: info.descriptionurl,
      usageNotes: usageNotes(asset, info),
      usageStatus: "approved",
    } as never;

    if (!mediaId) {
      const created = (await payload.create({
        collection: "media" as never,
        data,
        filePath,
        overrideAccess: true,
      })) as { id: number | string };
      mediaId = Number(created.id);
      console.log(`uploaded Commons image #${mediaId} -> ${asset.slug}`);
    } else {
      await payload.update({
        collection: "media" as never,
        id: mediaId,
        data,
        overrideAccess: true,
      });
      console.log(`reused Commons media #${mediaId} -> ${asset.slug}`);
    }

    await setPrimaryImage(db, Number(item.id), mediaId, asset.alt);
    await addSourceRow(
      db,
      Number(item.id),
      `${asset.caption} image source`,
      info.descriptionurl,
    );
    report.push({
      commonsTitle: asset.commonsTitle,
      license,
      mediaId,
      sourceUrl: info.descriptionurl,
      slug: asset.slug,
      status: "linked-commons",
    });
  }

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`wrote ${reportPath}`);
} finally {
  await db.end();
}

process.exit(0);
