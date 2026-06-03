import originalContent from "@/data/karachi-original-content.json";
import nextEnv from "@next/env";
import { getPayload } from "payload";

type OriginalContentEntry = {
  location?: string;
  paragraphs?: string[];
};

type GuideItemDoc = {
  address?: string | null;
  body?: unknown;
  id: number | string;
  kind?: string | null;
  slug?: string | null;
  title?: string | null;
};

const contentByKey = originalContent as Record<string, OriginalContentEntry>;

nextEnv.loadEnvConfig(process.cwd());

const bodyToLexical = (paragraphs: string[]) => ({
  root: {
    type: "root" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: paragraphs.map((paragraph) => ({
      type: "paragraph" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: [
        {
          type: "text" as const,
          text: paragraph,
          format: 0,
          style: "",
          mode: "normal" as const,
          detail: 0,
          version: 1,
        },
      ],
    })),
  },
});

const hasLexicalBody = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const root = (value as { root?: { children?: unknown[] } }).root;
  return Array.isArray(root?.children) && root.children.length > 0;
};

const cleanParagraphs = (entry: OriginalContentEntry) =>
  (entry.paragraphs ?? [])
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const { default: config } = await import("@/payload.config");
const payload = await getPayload({ config });

let page = 1;
let scanned = 0;
let updated = 0;
let skippedExistingBody = 0;
let skippedNoSource = 0;

for (;;) {
  const result = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 100,
    overrideAccess: true,
    page,
    where: {
      city: {
        exists: true,
      },
    },
  });

  for (const doc of result.docs as GuideItemDoc[]) {
    scanned += 1;
    const key = `${doc.kind ?? ""}:${doc.slug ?? ""}`;
    const entry = contentByKey[key];
    const paragraphs = entry ? cleanParagraphs(entry) : [];

    if (!entry || paragraphs.length === 0) {
      skippedNoSource += 1;
      continue;
    }

    if (hasLexicalBody(doc.body)) {
      skippedExistingBody += 1;
      continue;
    }

    await payload.update({
      collection: "guide-items" as never,
      id: doc.id,
      data: {
        body: bodyToLexical(paragraphs),
        ...(entry.location && !doc.address ? { address: entry.location } : {}),
      } as never,
      overrideAccess: true,
    });

    updated += 1;
    console.log(`updated ${key} (${doc.title ?? doc.id})`);
  }

  if (!result.hasNextPage) break;
  page += 1;
}

console.log(
  JSON.stringify(
    {
      scanned,
      skippedExistingBody,
      skippedNoSource,
      updated,
    },
    null,
    2,
  ),
);

process.exit(0);
