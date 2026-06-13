import nextEnv from "@next/env";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());

type GuideArticleBlock = {
  text?: string;
  type?: string;
};

type GuideArticle = {
  blocks?: GuideArticleBlock[];
  slug: string;
  title: string;
};

type GuideSectionSource = {
  articles?: GuideArticle[];
};

type TranslationRecord = Record<string, unknown>;

const ignoredVisibleTextKeys = new Set([
  "googleMapsUrl",
  "href",
  "key",
  "mapUrl",
  "officialUrl",
  "purpose",
  "sourceUrl",
  "style",
  "type",
  "url",
]);

const hasArabic = (value: unknown) => /[\u0600-\u06FF]/.test(String(value ?? ""));

const visibleContentString = (value: unknown): string => {
  const chunks: string[] = [];

  const walk = (node: unknown, key = "") => {
    if (typeof node === "string") {
      if (!ignoredVisibleTextKeys.has(key)) chunks.push(node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((child) => walk(child));
      return;
    }

    if (node && typeof node === "object") {
      Object.entries(node as Record<string, unknown>).forEach(([childKey, child]) => {
        walk(child, childKey);
      });
    }
  };

  walk(value);
  return chunks.join(" ");
};

const paragraphText = (blocks: GuideArticleBlock[] | undefined) =>
  (blocks ?? [])
    .filter((block) => block.type !== "table")
    .map((block) => block.text ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const db = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await db.connect();

  const rows = (
    await db.query<{
      section_slug: string;
      source_import: GuideSectionSource | null;
      translations: { ar?: { articles?: Record<string, TranslationRecord> } } | null;
    }>(`
      select section_slug, source_import, translations
      from payload.guide_sections
      where city_id = (select id from payload.cities where slug = 'london')
      order by section_slug
    `)
  ).rows;

  const articleIssues = rows.flatMap((row) => {
    const arabicArticles = row.translations?.ar?.articles ?? {};

    return (row.source_import?.articles ?? []).flatMap((article) => {
      const translatedArticle = arabicArticles[article.slug] ?? {};
      const englishBody = paragraphText(article.blocks);
      const arabicBody = paragraphText(
        (translatedArticle.blocks as GuideArticleBlock[] | undefined) ?? [],
      );
      const visibleContent = visibleContentString(translatedArticle);
      const latinWords =
        visibleContent.match(/[A-Za-z][A-Za-z'’&.-]{2,}/g)?.filter(Boolean) ?? [];

      const issues: string[] = [];
      if (!hasArabic(translatedArticle.title)) issues.push("title_not_arabic");
      if (!hasArabic(translatedArticle.summary)) issues.push("summary_not_arabic");
      if (
        englishBody.length > 700 &&
        arabicBody.length < Math.max(500, englishBody.length * 0.55)
      ) {
        issues.push("article_too_short_vs_source");
      }
      if (latinWords.length > 0) {
        issues.push(`latin_text:${[...new Set(latinWords)].slice(0, 10).join("|")}`);
      }

      return issues.length > 0
        ? [
            {
              article: article.slug,
              englishBodyLength: englishBody.length,
              arabicBodyLength: arabicBody.length,
              issues: issues.join(","),
              section: row.section_slug,
              title: article.title,
            },
          ]
        : [];
    });
  });

  console.log("London Arabic article QA");
  console.log(
    JSON.stringify(
      {
        articleIssues: articleIssues.length,
      },
      null,
      2,
    ),
  );
  console.table(articleIssues.slice(0, 80));

  await db.end();

  if (articleIssues.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
