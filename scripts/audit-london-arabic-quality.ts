import nextEnv from "@next/env";
import { Client } from "pg";

nextEnv.loadEnvConfig(process.cwd());

const templateNeedles = [
  "يساعد هذا المعلم الزائر على قراءة جانب من تاريخ لندن أو ثقافتها أو فضائها الحضري",
  "هذا السجل يساعد المسافر المسلم على تخطيط الوجبات حول الأحياء والمعالم",
  "نقطة عملية لتخطيط الصلاة في لندن",
  "وجهة مفيدة ضمن تخطيط زيارة لندن",
  "يساعد هذا السجل الزائر على فهم",
  "قبل الاعتماد أو الزيارة، تحقق من مواقيت الصلاة",
  "قبل الحجز أو التوصية، تحقق من الفرع المحدد",
];

const allowedLatin = new Set([
  "API",
  "BST",
  "ETA",
  "GBP",
  "GMT",
  "GOV",
  "HMC",
  "NHS",
  "PDF",
  "TfL",
  "UK",
  "URL",
  "UTC",
  "XE",
]);

type LexicalNode = {
  children?: LexicalNode[];
  text?: string;
};

const textFromLexical = (node: unknown): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(textFromLexical).join(" ");
  if (typeof node === "object") {
    const lexicalNode = node as LexicalNode;
    return [lexicalNode.text, textFromLexical(lexicalNode.children)]
      .filter(Boolean)
      .join(" ");
  }
  return "";
};

const hasArabic = (value: unknown) => /[\u0600-\u06FF]/.test(String(value ?? ""));

const latinLeakCount = (value: unknown) =>
  (String(value ?? "").match(/[A-Za-z][A-Za-z'’&.-]{2,}/g) ?? []).filter(
    (word) => !allowedLatin.has(word),
  ).length;

const stripNonEditorialLatin = (value: unknown) =>
  String(value ?? "")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/www\.\S+/g, " ")
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/g, " ")
    .replace(/\b[A-Z]{1,3}\d{1,3}\b/g, " ");

const main = async () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const db = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await db.connect();

  const itemRows = (
    await db.query<{
      section_slug: string;
      kind: string;
      slug: string;
      title: string;
      body: unknown;
      arabic_title: string | null;
      arabic_summary: string | null;
      arabic_overview: string | null;
      arabic_area: string | null;
      arabic_category: string | null;
      arabic_address: string | null;
    }>(`
      select
        gs.section_slug,
        gi.kind,
        gi.slug,
        gi.title,
        gi.body,
        gi.arabic_title,
        gi.arabic_summary,
        gi.arabic_overview,
        gi.arabic_area,
        gi.arabic_category,
        gi.arabic_address
      from payload.guide_items gi
      join payload.guide_sections gs on gs.id = gi.section_id
      where gi.city_id = (select id from payload.cities where slug = 'london')
      order by gs.section_slug, gi.kind, gi.id
    `)
  ).rows;

  const itemIssues = itemRows.flatMap((row) => {
    const englishBody = textFromLexical((row.body as { root?: unknown })?.root)
      .replace(/\s+/g, " ")
      .trim();
    const arabicOverview = row.arabic_overview ?? "";
    const arabicText = [
      row.arabic_title,
      row.arabic_summary,
      row.arabic_overview,
      row.arabic_area,
      row.arabic_category,
      row.arabic_address,
    ]
      .filter(Boolean)
      .join(" ");

    const issues: string[] = [];
    if (!hasArabic(row.arabic_title)) issues.push("title_not_arabic");
    if (!hasArabic(row.arabic_summary)) issues.push("summary_not_arabic");
    if (!hasArabic(row.arabic_overview)) issues.push("overview_not_arabic");
    if (
      englishBody.length > 700 &&
      arabicOverview.length < Math.max(650, englishBody.length * 0.6)
    ) {
      issues.push("overview_too_short_vs_body");
    }
    if (templateNeedles.some((needle) => arabicText.includes(needle))) {
      issues.push("template_copy");
    }

    const visibleEditorialLatin = latinLeakCount(stripNonEditorialLatin(arabicText));
    if (visibleEditorialLatin > 6) issues.push("heavy_latin_text");

    return issues.length > 0
      ? [
          {
            section: row.section_slug,
            kind: row.kind,
            slug: row.slug,
            title: row.title,
            issues: issues.join(","),
            englishBodyLength: englishBody.length,
            arabicOverviewLength: arabicOverview.length,
            latin: visibleEditorialLatin,
          },
        ]
      : [];
  });

  const sectionCounts = itemIssues.reduce<Record<string, number>>(
    (counts, issue) => {
      const key = `${issue.section}/${issue.kind}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {},
  );

  console.log("London Arabic item QA");
  console.table(
    Object.entries(sectionCounts)
      .map(([sectionKind, count]) => ({ sectionKind, count }))
      .sort((a, b) => b.count - a.count),
  );
  console.log(
    JSON.stringify(
      {
        totalItems: itemRows.length,
        issueItems: itemIssues.length,
      },
      null,
      2,
    ),
  );
  console.table(itemIssues.slice(0, 80));

  await db.end();

  if (itemIssues.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
