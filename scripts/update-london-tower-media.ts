import nextEnv from "@next/env";
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

const baseDir =
  process.argv[2] || "/Users/zulfiqar/Downloads/2026-06-12 - 6 files";

type Asset = {
  alt: string;
  attribution: string;
  caption: string;
  copyright?: string;
  exifCreated?: string;
  filename: string;
  itemSlug: "tower-bridge" | "tower-of-london";
  makeModel?: string;
  originalDescription?: string;
  outputBase: string;
  photographer: string;
  primary?: boolean;
  software?: string;
};

const assets: Asset[] = [
  {
    alt: "Tower Bridge at dusk from the Thames, London",
    attribution: "VisitBritain/George Johnson",
    caption: "View from below Tower Bridge towards the City of London at dusk.",
    copyright: "©VisitBritain/George Johnson",
    exifCreated: "2018-11-01 10:01:37",
    filename: "VB8LJ3.jpg",
    itemSlug: "tower-bridge",
    makeModel: "Canon EOS 5D Mark II",
    originalDescription:
      "View from below Tower Bridge and the city at night in Southwark, London",
    outputBase: "london-tower-bridge-visitbritain-george-johnson",
    photographer: "VisitBritain/George Johnson",
    primary: true,
    software: "Adobe Photoshop CC 2019 (Macintosh)",
  },
  {
    alt: "Tower Bridge, The Shard, and HMS Belfast from the Thames, London",
    attribution: "VisitBritain",
    caption:
      "Tower Bridge, The Shard, and HMS Belfast seen from a tourist RIB boat on the River Thames.",
    exifCreated: "2024-11-14 12:54:54",
    filename: "VB8JG5.jpg",
    itemSlug: "tower-bridge",
    makeModel: "Canon EOS R6m2",
    originalDescription:
      "A view across the river Thames from a tourist rib boat to Tower bridge, The Shard and HMS Belfast",
    outputBase: "london-tower-bridge-thames-rib-visitbritain",
    photographer: "VisitBritain",
    software: "Adobe Photoshop Lightroom Classic 14.0.1 (Macintosh)",
  },
  {
    alt: "Tower Bridge with a Thames Rockets boat, London",
    attribution: "VisitBritain supplied asset",
    caption: "Tower Bridge seen from the Thames with a Thames Rockets boat passing in front.",
    filename: "VB8BVK.png",
    itemSlug: "tower-bridge",
    originalDescription:
      "No embedded description or photographer field found; visual identification is Tower Bridge, London, with a Thames Rockets boat.",
    outputBase: "london-tower-bridge-thames-rockets",
    photographer: "Credit unavailable in embedded metadata",
  },
  {
    alt: "Yeoman Warders at the Tower of London, London",
    attribution: "Historic Royal Palaces/Lea Hair",
    caption: "Two Yeoman Warders stand guard at the Tower of London.",
    exifCreated: "2025-07-21 10:09:07",
    filename: "VB7571.jpg",
    itemSlug: "tower-of-london",
    makeModel: "Canon EOS R6m2",
    originalDescription:
      "Two Beefeaters stand guard at the Tower of London, England.",
    outputBase: "london-tower-of-london-yeoman-warders-lea-hair",
    photographer: "Historic Royal Palaces/Lea Hair",
    primary: true,
    software: "Adobe Photoshop Lightroom Classic 14.4 (Macintosh)",
  },
  {
    alt: "Crown Jewels entrance at the Tower of London",
    attribution: "Richard Watson / Historic Royal Palaces",
    caption: "Family approaching the Crown Jewels entrance at the Tower of London.",
    copyright: "© Historic Royal Palaces",
    filename: "VB7572.jpg",
    itemSlug: "tower-of-london",
    originalDescription:
      "Models shoot around the Tower (exterior): Family in front of Waterloo Block ready to go and see the Crown Jewels.",
    outputBase: "london-tower-of-london-crown-jewels-richard-watson",
    photographer: "Richard Watson",
  },
  {
    alt: "Yeoman Warder tour at the Tower of London",
    attribution: "Historic Royal Palaces/Michael B",
    caption: "A Yeoman Warder directing a tour group at the Tower of London.",
    copyright: "© Historic Royal Palaces",
    exifCreated: "2023-07-16 19:05:21",
    filename: "VB7573.jpg",
    itemSlug: "tower-of-london",
    makeModel: "SONY ILCE-1",
    originalDescription:
      "A Beefeater directing a tour group at the Tower of London, England.",
    outputBase: "london-tower-of-london-yeoman-warder-tour-michael-b",
    photographer: "Historic Royal Palaces/Michael B",
    software: "PhotoShelter https://www.photoshelter.com",
  },
];

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sourcePath = (asset: Asset) => path.join(baseDir, asset.filename);
const outputPath = (asset: Asset) =>
  path.join(os.tmpdir(), `${asset.outputBase}${path.extname(asset.filename)}`);

const usageNotes = (asset: Asset) =>
  [
    `Supplied file ${asset.filename}.`,
    asset.originalDescription
      ? `Embedded description: ${asset.originalDescription}.`
      : undefined,
    asset.copyright ? `Embedded copyright: ${asset.copyright}.` : undefined,
    asset.makeModel ? `Camera: ${asset.makeModel}.` : undefined,
    asset.software ? `Software: ${asset.software}.` : undefined,
    asset.exifCreated ? `EXIF creation date: ${asset.exifCreated}.` : undefined,
    `Place identification: ${asset.itemSlug === "tower-bridge" ? "Tower Bridge" : "Tower of London"}, London.`,
    "Rights note: asset supplied for Irhal editorial use; retain the stored attribution/copyright metadata during review.",
  ]
    .filter(Boolean)
    .join(" ");

await db.connect();

try {
  const mediaIdByOutputBase = new Map<string, number>();

  for (const asset of assets) {
    await fs.access(sourcePath(asset));
    await fs.copyFile(sourcePath(asset), outputPath(asset));

    const existing = await db.query(
      `select id
         from payload.media
        where filename like $1
        order by id desc
        limit 1`,
      [`${asset.outputBase}%`],
    );

    let mediaId = existing.rows[0]?.id
      ? Number(existing.rows[0].id)
      : undefined;

    const data = {
      alt: asset.alt,
      attribution: asset.attribution,
      caption: asset.caption,
      license: "partner-provided",
      photographer: asset.photographer,
      usageNotes: usageNotes(asset),
      usageStatus: "approved",
    } as never;

    if (!mediaId) {
      const created = (await payload.create({
        collection: "media" as never,
        filePath: outputPath(asset),
        data,
        overrideAccess: true,
      })) as { id: number | string; url?: string };
      mediaId = Number(created.id);
      console.log(`uploaded ${asset.filename} -> media #${mediaId} ${created.url ?? ""}`);
    } else {
      await payload.update({
        collection: "media" as never,
        id: mediaId,
        data,
        overrideAccess: true,
      });
      console.log(`reused ${asset.filename} -> media #${mediaId}`);
    }

    mediaIdByOutputBase.set(asset.outputBase, mediaId);
  }

  for (const slug of ["tower-bridge", "tower-of-london"] as const) {
    const itemAssets = assets.filter((asset) => asset.itemSlug === slug);
    const primaryAsset = itemAssets.find((asset) => asset.primary) ?? itemAssets[0];
    const primaryId = mediaIdByOutputBase.get(primaryAsset.outputBase);
    const galleryIds = itemAssets
      .filter((asset) => asset.outputBase !== primaryAsset.outputBase)
      .map((asset) => mediaIdByOutputBase.get(asset.outputBase))
      .filter((id): id is number => typeof id === "number");

    if (!primaryId) {
      throw new Error(`Missing primary media id for ${slug}`);
    }

    const item = await db.query(
      `select id
         from payload.guide_items
        where city_id = (select id from payload.cities where slug = 'london' limit 1)
          and kind = 'place'
          and slug = $1
        limit 1`,
      [slug],
    );
    const itemId = item.rows[0]?.id ? Number(item.rows[0].id) : undefined;
    if (!itemId) throw new Error(`Guide item not found: ${slug}`);

    await payload.update({
      collection: "guide-items" as never,
      id: itemId,
      data: {
        gallery: galleryIds.map((image) => ({ image })),
        image: primaryId,
        imageAlt: primaryAsset.alt,
      } as never,
      overrideAccess: true,
    });

    console.log(
      JSON.stringify(
        { galleryIds, itemId, primaryId, slug },
        null,
        2,
      ),
    );
  }
} finally {
  await db.end();
}
