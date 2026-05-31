import nextEnv from "@next/env";
import path from "node:path";
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

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

// Distinct media assets to push to Cloudflare R2 via Payload Media.
const mediaAssets: { key: string; file: string; alt: string }[] = [
  {
    key: "mohatta",
    file: "public/images/karachi-guide/place-mohatta-palace.jpg",
    alt: "Mohatta Palace Museum, Clifton, Karachi",
  },
  {
    key: "mazar",
    file: "public/images/karachi-guide/place-mazar-e-quaid.jpg",
    alt: "Mazar-e-Quaid, Karachi",
  },
  {
    key: "frere",
    file: "public/images/karachi-guide/place-frere-hall.jpg",
    alt: "Frere Hall, Karachi",
  },
  {
    key: "saddar",
    file: "public/images/karachi-guide/neighborhood-saddar.jpg",
    alt: "Saddar district, Karachi",
  },
];

// Which guide items get which media.
const links: { kind: string; slug: string; media: string }[] = [
  { kind: "place", slug: "mohatta-palace-museum", media: "mohatta" },
  { kind: "place", slug: "mazar-e-quaid", media: "mazar" },
  { kind: "place", slug: "frere-hall", media: "frere" },
  { kind: "place", slug: "national-museum-of-pakistan", media: "saddar" },
  { kind: "place", slug: "quaid-e-azam-house-museum", media: "saddar" },
  { kind: "place", slug: "wazir-mansion", media: "saddar" },
];

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
await db.connect();

try {
  const mediaIdByKey = new Map<string, number>();

  for (const asset of mediaAssets) {
    const existing = await db.query(
      "select id from payload.media where alt = $1 limit 1",
      [asset.alt],
    );
    if (existing.rows.length > 0) {
      const id = Number(existing.rows[0].id);
      mediaIdByKey.set(asset.key, id);
      console.log(`media exists: ${asset.alt} (#${id})`);
      continue;
    }

    const create = payload.create as (
      args: Record<string, unknown>,
    ) => Promise<{ id: number; url?: string }>;
    const created = await create({
      collection: "media",
      filePath: path.resolve(process.cwd(), asset.file),
      data: { alt: asset.alt, license: "owned", usageStatus: "approved" },
      overrideAccess: true,
    });

    mediaIdByKey.set(asset.key, created.id);
    console.log(`uploaded: ${asset.alt} -> media #${created.id} ${created.url ?? ""}`);
  }

  for (const link of links) {
    const mediaId = mediaIdByKey.get(link.media);
    if (!mediaId) {
      console.warn(`no media for ${link.slug}`);
      continue;
    }
    const result = await db.query(
      "update payload.guide_items set image_id = $1 where kind = $2 and slug = $3",
      [mediaId, link.kind, link.slug],
    );
    console.log(`linked ${link.kind}:${link.slug} -> media #${mediaId} (rows: ${result.rowCount})`);
  }

  const cityHeroMediaIds = ["mohatta", "mazar", "frere"]
    .map((key) => mediaIdByKey.get(key))
    .filter((id): id is number => typeof id === "number");
  if (cityHeroMediaIds.length > 0) {
    const cityRow = await db.query(
      "select id from payload.cities where slug = $1 limit 1",
      ["karachi"],
    );
    const cityId = cityRow.rows[0]?.id;
    if (cityId) {
      await payload.update({
        collection: "cities" as never,
        id: Number(cityId),
        data: {
          heroGallery: cityHeroMediaIds.map((image) => ({ image })),
        } as never,
        overrideAccess: true,
      });
      console.log(`city hero gallery set karachi -> media [${cityHeroMediaIds.join(", ")}]`);
    } else {
      console.warn("skip city hero gallery for karachi (city not found)");
    }
  }

  // Populate a multi-image gallery (both are genuine Mohatta Palace photos).
  const heroRow = await db.query(
    "select id from payload.media where filename like 'karachi-hero%' limit 1",
  );
  const heroMediaId = heroRow.rows[0]?.id
    ? Number(heroRow.rows[0].id)
    : undefined;
  const galleries: { kind: string; slug: string; mediaIds: number[] }[] = [
    {
      kind: "place",
      slug: "mohatta-palace-museum",
      mediaIds: [mediaIdByKey.get("mohatta"), heroMediaId].filter(
        (id): id is number => typeof id === "number",
      ),
    },
  ];

  for (const gallery of galleries) {
    if (gallery.mediaIds.length < 2) {
      console.warn(`skip gallery for ${gallery.slug} (need 2+ images)`);
      continue;
    }
    const itemRow = await db.query(
      "select id from payload.guide_items where kind = $1 and slug = $2",
      [gallery.kind, gallery.slug],
    );
    const itemId = itemRow.rows[0]?.id;
    if (!itemId) {
      console.warn(`no item for gallery ${gallery.slug}`);
      continue;
    }
    await payload.update({
      collection: "guide-items" as never,
      id: Number(itemId),
      data: { gallery: gallery.mediaIds.map((image) => ({ image })) } as never,
      overrideAccess: true,
    });
    console.log(`gallery set ${gallery.slug} -> media [${gallery.mediaIds.join(", ")}]`);
  }

  const summary = await db.query(
    "select count(*)::int as total, count(image_id)::int as with_image from payload.guide_items",
  );
  console.log("guide_items summary:", summary.rows[0]);
} finally {
  await db.end();
}

process.exit(0);
