import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GuideContent } from "@/components/guide-content";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { getCityBySlug } from "@/lib/city-data";
import { getGuideArticle, sectionCards } from "@/lib/guide-items";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; section: string; article: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, section, article: articleSlug } = await params;
  const city = getCityBySlug(citySlug);
  const article = city ? getGuideArticle(city, section, articleSlug) : undefined;
  if (!city || !article) return {};

  return pageMetadata({
    title: `${article.title} | ${city.name}`,
    description: article.summary,
    path: `/city/${city.slug}/section/${section}/${article.slug}`,
  });
}

export default async function GuideArticlePage({ params }: Props) {
  const { city: citySlug, section, article: articleSlug } = await params;
  const city = getCityBySlug(citySlug);
  const article = city ? getGuideArticle(city, section, articleSlug) : undefined;
  if (!city || !article) notFound();

  const sectionCard = sectionCards.find((item) => item.slug === section);

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: city.name, path: `/city/${city.slug}` },
          { name: sectionCard?.title ?? section, path: `/city/${city.slug}/section/${section}` },
          { name: article.title, path: `/city/${city.slug}/section/${section}/${article.slug}` },
        ])}
      />
      <main className="mx-auto max-w-4xl px-5 py-12">
        <Link className="font-mono text-sm uppercase tracking-widest text-slate-600 hover:text-slate-950" href={`/city/${city.slug}/section/${section}`}>
          Back to {sectionCard?.title ?? "section"}
        </Link>
        <header className="mt-10 border-b border-slate-200 pb-8">
          <p className="font-mono text-sm uppercase tracking-widest text-emerald-700">City guide article</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-950">{article.title}</h1>
          <p className="mt-6 text-xl leading-9 text-slate-600">{article.summary}</p>
        </header>
        <GuideContent blocks={article.blocks} />
      </main>
    </PageShell>
  );
}
