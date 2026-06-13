import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

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

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const sourceFile =
  process.argv[2] ||
  "/Users/zulfiqar/Downloads/2026-06-12 - 1 file/VB74HK.jpg";

const mediaAlt = "Natural History Museum entrance sign, South Kensington, London";
const caption = "Main entrance sign outside the Natural History Museum in London.";
const attribution = "VisitBritain";
const uploadFilename = "london-natural-history-museum-visitbritain.jpg";
const uploadPath = path.join(os.tmpdir(), uploadFilename);
const metadataSummary =
  "Embedded metadata from VB74HK.jpg: artist/author VisitBritain; description \"The main entrance sign out the front of the Natural History Museum, in London.\"; FUJIFILM X-T30 II; Adobe Lightroom 8.2 (Macintosh); 6240x4160 JPEG; metadata creation date 2025-04-10; EXIF creation date 2025-04-16 14:16:00; no embedded copyright, GPS, or source URL found.";

await fs.access(sourceFile);
await fs.copyFile(sourceFile, uploadPath);

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await db.connect();

try {
  const existing = await db.query(
    `select id
       from payload.media
      where attribution = $1
        and alt = $2
        and filename like 'london-natural-history-museum-visitbritain%'
      order by id desc
      limit 1`,
    [attribution, mediaAlt],
  );

  let mediaId = existing.rows[0]?.id ? Number(existing.rows[0].id) : undefined;

  if (!mediaId) {
    const created = (await payload.create({
      collection: "media" as never,
      filePath: uploadPath,
      data: {
        alt: mediaAlt,
        attribution,
        caption,
        license: "partner-provided",
        photographer: attribution,
        usageNotes: [
          metadataSummary,
          "Place identification: Natural History Museum, South Kensington, London, confirmed by embedded description and visible entrance signage.",
          "Rights note: credit is stored from embedded metadata; no embedded copyright or license statement was present, so editorial rights should be retained with the supplied asset record.",
        ].join(" "),
        usageStatus: "approved",
      } as never,
      overrideAccess: true,
    })) as { id: number | string; url?: string };
    mediaId = Number(created.id);
    console.log(`uploaded media #${mediaId}: ${created.url ?? ""}`);
  } else {
    await payload.update({
      collection: "media" as never,
      id: mediaId,
      data: {
        alt: mediaAlt,
        attribution,
        caption,
        license: "partner-provided",
        photographer: attribution,
        usageNotes: [
          metadataSummary,
          "Place identification: Natural History Museum, South Kensington, London, confirmed by embedded description and visible entrance signage.",
          "Rights note: credit is stored from embedded metadata; no embedded copyright or license statement was present, so editorial rights should be retained with the supplied asset record.",
        ].join(" "),
        usageStatus: "approved",
      } as never,
      overrideAccess: true,
    });
    console.log(`reused media #${mediaId}`);
  }

  const linked = await db.query(
    `update payload.guide_items
        set image_id = $1,
            image_alt = $2,
            updated_at = now()
      where city_id = (select id from payload.cities where slug = 'london' limit 1)
        and slug = 'natural-history-museum'
        and kind in ('place', 'family')
      returning id, kind, slug, title, image_id`,
    [mediaId, mediaAlt],
  );

  console.log(JSON.stringify({ mediaId, linked: linked.rows }, null, 2));
} finally {
  await db.end();
}
