import nextEnv from "@next/env";
import fs from "node:fs/promises";
import path from "node:path";

nextEnv.loadEnvConfig(process.cwd());

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

type PayloadDoc = Record<string, unknown> & {
  id: number | string;
};

type GuideBlock = {
  type: "paragraph";
  style: "Normal";
  text: string;
  links: [];
};

type ArticleImport = {
  articleSlug: "city-today" | "city-back-then";
  citySlug: "karachi" | "london";
  imageAlt: string;
  pageUrl: string;
};

const tmpDir = path.join(process.cwd(), "tmp", "city-history-today-media");

const targets: ArticleImport[] = [
  {
    articleSlug: "city-back-then",
    citySlug: "karachi",
    imageAlt: "Karachi History",
    pageUrl: "https://irhal.com/travel-guide/karachi/city-overview-history/karachi-history/",
  },
  {
    articleSlug: "city-today",
    citySlug: "karachi",
    imageAlt: "Karachi Today",
    pageUrl: "https://irhal.com/travel-guide/karachi/city-overview-history/karachi-today/",
  },
  {
    articleSlug: "city-today",
    citySlug: "london",
    imageAlt: "London Today",
    pageUrl: "https://irhal.com/travel-guide/London/city-overview-history/London-today/",
  },
  {
    articleSlug: "city-back-then",
    citySlug: "london",
    imageAlt: "London History",
    pageUrl: "https://irhal.com/travel-guide/london/city-overview-history/london-history/",
  },
];

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const decodeHtml = (value: string) =>
  value
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_match, code: string) =>
      String.fromCodePoint(
        code.toLowerCase().startsWith("x")
          ? Number.parseInt(code.slice(1), 16)
          : Number.parseInt(code, 10),
      ),
    )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&#8216;|&lsquo;/g, "'")
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&ldquo;/g, "\"")
    .replace(/&#8221;|&rdquo;/g, "\"")
    .replace(/&hellip;/g, "…");

const stripHtml = (value: string) =>
  decodeHtml(value.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

const fileExtension = (url: string) =>
  path.extname(new URL(url).pathname).split("?")[0] || ".jpg";

const londonGuideItemSlug = (articleSlug: ArticleImport["articleSlug"]) =>
  articleSlug === "city-today" ? "london-today" : "london-history";

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

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: { "user-agent": "IrhalCityHistoryImporter/1.0 (+https://irhal.com)" },
  });
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.text();
};

const extractLegacyArticle = async (target: ArticleImport) => {
  const html = await fetchText(target.pageUrl);
  const title = stripHtml(
    html.match(/<h1[^>]*class=["'][^"']*entry-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
      target.imageAlt,
  );
  const content = html.match(
    /<div[^>]*class=["'][^"']*entry-visibility[^"']*["'][^>]*>([\s\S]*?)<div[^>]*class=["'][^"']*toggle-desc/i,
  )?.[1];

  if (!content) throw new Error(`Could not find article body for ${target.pageUrl}`);

  const imageUrl = content.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i)?.[1];
  if (!imageUrl) throw new Error(`Could not find article image for ${target.pageUrl}`);

  const paragraphs = [...content.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter(Boolean);

  if (paragraphs.length === 0) {
    throw new Error(`Could not find article paragraphs for ${target.pageUrl}`);
  }

  return {
    blocks: paragraphs.map((text): GuideBlock => ({
      type: "paragraph",
      style: "Normal",
      text,
      links: [],
    })),
    imageUrl: decodeHtml(imageUrl),
    summary: paragraphs[0],
    title,
  };
};

const downloadImage = async (url: string, filenameBase: string) => {
  await fs.mkdir(tmpDir, { recursive: true });
  const response = await fetch(url, {
    headers: { "user-agent": "IrhalCityHistoryImporter/1.0 (+https://irhal.com)" },
  });
  if (!response.ok) throw new Error(`Image download failed ${response.status}: ${url}`);
  const filePath = path.join(tmpDir, `${slugify(filenameBase)}${fileExtension(url)}`);
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
};

const relationshipId = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") return Number(value);
  const id = asRecord(value).id;
  return typeof id === "number" || typeof id === "string" ? Number(id) : undefined;
};

const mediaUrl = (doc: PayloadDoc | undefined) => {
  if (!doc) return undefined;
  const sizes = asRecord(doc.sizes);
  const card = asRecord(sizes.card);
  const hero = asRecord(sizes.hero);
  return asString(card.url) || asString(hero.url) || asString(doc.url);
};

const ensureMedia = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  target: ArticleImport,
  article: Awaited<ReturnType<typeof extractLegacyArticle>>,
) => {
  const existing = await payload.find({
    collection: "media" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { sourceUrl: { equals: article.imageUrl } },
  });
  const existingDoc = existing.docs[0] as PayloadDoc | undefined;
  const existingUrl = mediaUrl(existingDoc);
  if (existingDoc?.id && existingUrl) {
    return { id: existingDoc.id, url: existingUrl };
  }

  const filePath = await downloadImage(article.imageUrl, `${target.citySlug}-${article.title}`);
  const created = (await payload.create({
    collection: "media" as never,
    data: {
      alt: target.imageAlt,
      attribution: "Irhal legacy editorial archive",
      caption: `${article.title}. Source: Irhal legacy editorial archive.`,
      license: "owned",
      sourceUrl: article.imageUrl,
      usageNotes:
        "Imported from the owned Irhal legacy WordPress archive for city history/today article pages.",
      usageStatus: "approved",
    } as never,
    filePath,
    overrideAccess: true,
  })) as PayloadDoc;

  return { id: created.id, url: mediaUrl(created) || article.imageUrl };
};

const withLegacySource = (
  existingSources: Array<Record<string, unknown>>,
  title: string,
  pageUrl: string,
  now: string,
) => {
  if (existingSources.some((source) => asString(source.url) === pageUrl)) {
    return existingSources;
  }

  return [
    ...existingSources,
    {
      label: title,
      url: pageUrl,
      type: "editorial",
      verifiedAt: now,
      confidence: "high",
    },
  ];
};

const updateLondonGuideItem = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  city: PayloadDoc,
  section: PayloadDoc,
  target: ArticleImport,
  legacy: Awaited<ReturnType<typeof extractLegacyArticle>>,
  media: { id: PayloadDoc["id"]; url: string },
  now: string,
) => {
  if (target.citySlug !== "london") return;

  const slug = londonGuideItemSlug(target.articleSlug);
  const existingResult = await payload.find({
    collection: "guide-items" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { city: { equals: relationshipId(city.id) } },
        { slug: { equals: slug } },
      ],
    },
  });
  const existing = existingResult.docs[0] as PayloadDoc | undefined;
  const existingSources = Array.isArray(existing?.sources)
    ? (existing.sources as Array<Record<string, unknown>>)
    : [];

  const data = {
    body: bodyToLexical(legacy.blocks.map((block) => block.text)),
    city: city.id,
    image: media.id,
    imageAlt: target.imageAlt,
    importedDetails: {
      ...asRecord(existing?.importedDetails),
      legacyIrhalImageUrl: legacy.imageUrl,
      legacyIrhalImportedAt: now,
      legacyIrhalPageUrl: target.pageUrl,
      legacy_irhal_history_today_import_batch: "2026-06-11-city-history-today",
    },
    kind: asString(existing?.kind) || "place",
    section: section.id,
    sectionSlug: "city-information",
    seo: {
      description: legacy.summary,
      robots: "index,follow",
      schemaType: "Article",
      title: `${legacy.title} | London`,
    },
    slug,
    sourceRowId: `irhal-legacy-${slug}`,
    sourceTable: "irhal_legacy_city_history_today",
    sources: withLegacySource(existingSources, legacy.title, target.pageUrl, now),
    summary: legacy.summary,
    title: legacy.title,
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
    console.log(`updated london guide-item:${slug} -> #${existing.id}`);
    return;
  }

  const created = (await payload.create({
    collection: "guide-items" as never,
    data: data as never,
    overrideAccess: true,
  })) as PayloadDoc;
  console.log(`created london guide-item:${slug} -> #${created.id}`);
};

const updateTarget = async (
  payload: Awaited<ReturnType<typeof getPayload>>,
  target: ArticleImport,
) => {
  const cityResult = await payload.find({
    collection: "cities" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: { slug: { equals: target.citySlug } },
  });
  const city = cityResult.docs[0] as PayloadDoc | undefined;
  if (!city?.id) throw new Error(`Missing city ${target.citySlug}`);

  const sectionResult = await payload.find({
    collection: "guide-sections" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { city: { equals: relationshipId(city.id) } },
        { sectionSlug: { equals: "city-information" } },
      ],
    },
  });
  const section = sectionResult.docs[0] as PayloadDoc | undefined;
  if (!section?.id) throw new Error(`Missing city-information for ${target.citySlug}`);

  const legacy = await extractLegacyArticle(target);
  const media = await ensureMedia(payload, target, legacy);
  const sourceImport = asRecord(section.sourceImport);
  const articles = Array.isArray(sourceImport.articles)
    ? (sourceImport.articles as Array<Record<string, unknown>>)
    : [];
  let matched = false;
  const now = new Date().toISOString();
  const nextArticles = articles.map((article) => {
    if (asString(article.slug) !== target.articleSlug) return article;
    matched = true;
    return {
      ...article,
      title: legacy.title,
      slug: target.articleSlug,
      summary: legacy.summary,
      blocks: legacy.blocks,
      imageUrl: media.url,
      imageAlt: target.imageAlt,
      legacyIrhalImageUrl: legacy.imageUrl,
      legacyIrhalPageUrl: target.pageUrl,
      legacyIrhalImportedAt: now,
    };
  });

  if (!matched) {
    throw new Error(
      `Article ${target.articleSlug} not found in ${target.citySlug} city-information`,
    );
  }

  const existingSources = Array.isArray(section.sources)
    ? (section.sources as Array<Record<string, unknown>>)
    : [];

  await payload.update({
    collection: "guide-sections" as never,
    id: section.id,
    data: {
      sourceImport: {
        ...sourceImport,
        articles: nextArticles,
      },
      sources: withLegacySource(existingSources, legacy.title, target.pageUrl, now),
      workflowStatus: "published",
      _status: "published",
    } as never,
    overrideAccess: true,
  });

  await updateLondonGuideItem(payload, city, section, target, legacy, media, now);

  console.log(
    `updated ${target.citySlug}:${target.articleSlug} from ${legacy.title} (${legacy.blocks.length} paragraphs)`,
  );
};

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const payload = await getPayload({ config });
for (const target of targets) {
  await updateTarget(payload, target);
}

process.exit(0);
