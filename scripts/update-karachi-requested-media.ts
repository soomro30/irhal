import nextEnv from "@next/env";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createRequire } from "node:module";

nextEnv.loadEnvConfig(process.cwd());

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

const run = promisify(execFile);
const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type TargetMedia = {
  alt: string;
  attribution: string;
  filename: string;
  kind: "place";
  license: "creative-commons" | "licensed";
  licenseLabel: string;
  pageUrl: string;
  photographer: string;
  slug: string;
  sourceUrl: string;
  title: string;
};

const targets: TargetMedia[] = [
  {
    alt: "Empress Market, Karachi",
    attribution: "A.Savin, Wikipedia, Free Art License",
    filename: "place-empress-market-wikimedia.jpg",
    kind: "place",
    license: "licensed",
    licenseLabel: "Free Art License",
    pageUrl:
      "https://commons.wikimedia.org/wiki/File:PK_Karachi_asv2020-02_img36_Empress_Market.jpg",
    photographer: "A.Savin",
    slug: "empress-market",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/d/d5/PK_Karachi_asv2020-02_img36_Empress_Market.jpg",
    title: "Empress Market",
  },
  {
    alt: "Hill Park, Karachi",
    attribution: "Adnanrail, CC BY-SA 3.0",
    filename: "place-hill-park-wikimedia.jpg",
    kind: "place",
    license: "creative-commons",
    licenseLabel: "CC BY-SA 3.0",
    pageUrl:
      "https://commons.wikimedia.org/wiki/File:Hill_Park_02,_Karachi,_Pakistan.jpg",
    photographer: "Adnanrail",
    slug: "hill-park",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/8b/Hill_Park_02%2C_Karachi%2C_Pakistan.jpg",
    title: "Hill Park",
  },
  {
    alt: "Ferris wheel at Aladin Park, Karachi",
    attribution: "Anwar Ahmed, CC BY-SA 3.0",
    filename: "place-aladin-park-wikimedia.jpg",
    kind: "place",
    license: "creative-commons",
    licenseLabel: "CC BY-SA 3.0",
    pageUrl:
      "https://commons.wikimedia.org/wiki/File:Alladin_Park_Karachi_-_panoramio_(5).jpg",
    photographer: "Anwar Ahmed",
    slug: "aladin-park-legacy-site",
    sourceUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/4e/Alladin_Park_Karachi_-_panoramio_%285%29.jpg",
    title: "Aladin Park Legacy Site",
  },
];

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const requestedSlugs = new Set(process.argv.slice(2));
const selectedTargets =
  requestedSlugs.size > 0
    ? targets.filter((target) => requestedSlugs.has(target.slug))
    : targets;

if (selectedTargets.length === 0) {
  throw new Error(
    `No requested media targets matched: ${Array.from(requestedSlugs).join(", ")}`,
  );
}

const tmpDir = path.join(os.tmpdir(), "irhal-requested-karachi-media");
await fs.mkdir(tmpDir, { recursive: true });

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await db.connect();

try {
  for (const target of selectedTargets) {
    const localPath = path.join(tmpDir, target.filename);

    await run("curl", [
      "-4",
      "-L",
      "--fail",
      "--max-time",
      "90",
      "-o",
      localPath,
      target.sourceUrl,
    ]);

    const existingMedia = await db.query(
      "select id from payload.media where source_url = any($1::text[]) or filename = $2 limit 1",
      [[target.pageUrl, target.sourceUrl], target.filename],
    );

    let mediaId = existingMedia.rows[0]?.id
      ? Number(existingMedia.rows[0].id)
      : undefined;

    if (!mediaId) {
      const created = (await payload.create({
        collection: "media" as never,
        filePath: localPath,
        data: {
          alt: target.alt,
          attribution: target.attribution,
          caption: `${target.title}, Karachi. Source: Wikimedia Commons.`,
          license: target.license,
          photographer: target.photographer,
          sourceUrl: target.pageUrl,
          usageNotes: `${target.licenseLabel}. Original image: ${target.sourceUrl}`,
          usageStatus: "approved",
        } as never,
        overrideAccess: true,
      })) as { id: number | string };

      mediaId = Number(created.id);
      console.log(`uploaded ${target.kind}:${target.slug} -> media #${mediaId}`);
    } else {
      console.log(`media exists ${target.kind}:${target.slug} -> media #${mediaId}`);
    }

    const guideItem = await payload.find({
      collection: "guide-items" as never,
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        and: [
          { kind: { equals: target.kind } },
          { slug: { equals: target.slug } },
        ],
      },
    });

    const guideItemId = (guideItem.docs[0] as { id?: number | string } | undefined)
      ?.id;
    if (!guideItemId) {
      console.warn(`missing guide item ${target.kind}:${target.slug}`);
      continue;
    }

    await payload.update({
      collection: "guide-items" as never,
      id: guideItemId,
      data: {
        image: mediaId,
        imageAlt: target.alt,
      } as never,
      overrideAccess: true,
    });

    console.log(`linked ${target.kind}:${target.slug} -> media #${mediaId}`);
  }
} finally {
  await db.end();
}

process.exit(0);
