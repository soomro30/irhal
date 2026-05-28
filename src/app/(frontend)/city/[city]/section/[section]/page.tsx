import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GuideItemGrid } from "@/components/guide-item-card";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { getCityBySlug, getGuideSection } from "@/lib/city-data";
import { getGuideArticlesForSection, getGuideItemsForSection, sectionCards } from "@/lib/guide-items";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; section: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, section: sectionSlug } = await params;
  const city = getCityBySlug(citySlug);
  const guideSection = city ? getGuideSection(city, sectionSlug) : undefined;
  if (!city || !guideSection) return {};

  const card = sectionCards.find((item) => item.slug === sectionSlug);

  return pageMetadata({
    title: `${card?.title ?? guideSection.title.replace(/^[0-9]+\\.\\s*/, "")} | ${city.name} Guide`,
    description: card?.summary ?? `${city.name} ${guideSection.title} from the Irhal enterprise city guide.`,
    path: `/city/${city.slug}/section/${guideSection.slug}`,
  });
}

export default async function CityGuideSectionPage({ params }: Props) {
  const { city: citySlug, section: sectionSlug } = await params;
  const city = getCityBySlug(citySlug);
  const guideSection = city ? getGuideSection(city, sectionSlug) : undefined;
  if (!city || !guideSection) notFound();

  const card = sectionCards.find((item) => item.slug === sectionSlug);
  const items = getGuideItemsForSection(city, sectionSlug);
  const articles = getGuideArticlesForSection(city, sectionSlug);

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: city.name, path: `/city/${city.slug}` },
          { name: card?.title ?? guideSection.title, path: `/city/${city.slug}/section/${guideSection.slug}` },
        ])}
      />
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-12">
            <Link className="font-mono text-sm uppercase tracking-widest text-slate-600 hover:text-slate-950" href={`/city/${city.slug}`}>
              Back to {city.name}
            </Link>
            <div className="mt-10 max-w-4xl">
              <p className="font-mono text-sm uppercase tracking-widest text-emerald-700">City guide section</p>
              <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">
                {card?.title ?? guideSection.title.replace(/^[0-9]+\\.\\s*/, "")}
              </h1>
              <p className="mt-6 text-xl leading-9 text-slate-600">
                {card?.summary ??
                  `${guideSection.title} is organized into linked records so editors can maintain each article, place, and listing as a separate document.`}
              </p>
            </div>
          </div>
        </section>

        {items.length > 0 ? (
          <section className="bg-white py-14">
            <div className="mx-auto max-w-7xl px-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-bold tracking-tight">Explore {card?.title.toLowerCase() ?? "items"}</h2>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
                    Each card opens a separate page and is modeled as its own Payload CMS document with image, map, SEO, source, and enrichment fields.
                  </p>
                </div>
                <p className="font-mono text-sm uppercase tracking-widest text-slate-500">{items.length} records</p>
              </div>
              <div className="mt-10">
                <GuideItemGrid city={city} items={items} />
              </div>
            </div>
          </section>
        ) : null}

        {articles.length > 0 ? (
          <section className="border-t border-slate-200 bg-slate-50 py-16">
            <div className="mx-auto max-w-7xl px-5">
              <h2 className="text-center text-4xl font-bold tracking-tight md:text-5xl">
                {city.name} travel tips from Irhal editors
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-center text-lg leading-8 text-slate-600">
                These are section-level documents generated from the guide headings. They can be edited independently in Payload.
              </p>
              <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <Link
                    className="bg-[#deddd9] p-6 transition hover:bg-[#d4d3cf]"
                    href={`/city/${city.slug}/section/${sectionSlug}/${article.slug}`}
                    key={article.slug}
                  >
                    <h3 className="font-serif text-2xl uppercase tracking-wide">{article.title}</h3>
                    <p className="mt-7 min-h-24 text-base leading-7 text-slate-800">{article.summary}</p>
                    <div className="mt-7 flex items-center gap-3 border-t border-slate-900 pt-5 font-mono text-sm uppercase tracking-widest">
                      Read full article
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}
