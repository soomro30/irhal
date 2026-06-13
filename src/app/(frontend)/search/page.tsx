import { ArrowRight, MapPin, SearchIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageShell } from "@/components/page-shell";
import { SiteSearchBox } from "@/components/site-search-box";
import { searchSite, type SearchLocale } from "@/lib/site-search";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Search | Irhal",
  description:
    "Search Irhal city guides, places, hotels, restaurants, shopping, masjids, neighborhoods, and travel essentials.",
  path: "/search",
  robots: {
    index: false,
    follow: true,
  },
});

export type SearchPageProps = {
  locale?: SearchLocale;
  searchParams?: Promise<{ city?: string; q?: string }>;
};

const copy = {
  ar: {
    breadcrumb: "البحث",
    empty: "ابدأ باسم مدينة أو مكان أو مطعم أو فندق.",
    heading: "ابحث في إرحل",
    noResults: "لم نجد نتائج مطابقة. جرّب اسم مدينة أو مكانًا قريبًا.",
    placeholder: "ابحث عن مدينة أو مكان",
    resultsFor: "نتائج البحث عن",
    search: "بحث",
    suggestions: "اقتراحات للبدء",
  },
  en: {
    breadcrumb: "Search",
    empty: "Start with a city, place, restaurant, hotel, or neighborhood.",
    heading: "Search Irhal",
    noResults: "No matching results yet. Try a city name or nearby place.",
    placeholder: "Find places and things to do",
    resultsFor: "Search results for",
    search: "Search",
    suggestions: "Suggestions to start",
  },
};

export async function SearchPageContent({
  locale = "en",
  searchParams,
}: SearchPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const query = (resolvedSearchParams.q ?? "").trim();
  const citySlug = (resolvedSearchParams.city ?? "").trim() || undefined;
  const isArabic = locale === "ar";
  const t = copy[locale];
  const results = await searchSite({
    citySlug,
    query,
    locale,
    limit: query ? 48 : 12,
  });

  return (
    <PageShell
      breadcrumbs={[
        { label: isArabic ? "الرئيسية" : "Home", href: isArabic ? "/ar" : "/" },
        { label: t.breadcrumb },
      ]}
      locale={locale}
    >
      <main className="bg-white" dir={isArabic ? "rtl" : "ltr"}>
        <section className="border-b border-ink/10 bg-paper-deep">
          <div className="mx-auto max-w-5xl px-5 py-10 md:py-14">
            <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-irhal-red">
              <SearchIcon aria-hidden="true" className="h-4 w-4" />
              {t.breadcrumb}
            </div>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-ink md:text-5xl">
              {t.heading}
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink/65">
              {query ? `${t.resultsFor} "${query}"` : t.empty}
            </p>
            <SiteSearchBox
              className="mt-7"
              citySlug={citySlug}
              initialQuery={query}
              key={`${locale}:${query}`}
              locale={locale}
              placeholder={t.placeholder}
              searchLabel={t.search}
            />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10 md:py-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                {query ? `${results.length} ${isArabic ? "نتيجة" : "results"}` : t.suggestions}
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink md:text-3xl">
                {query ? `${t.resultsFor} "${query}"` : t.suggestions}
              </h2>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {results.map((result) => (
                <Link
                  className="group grid grid-cols-[88px_minmax(0,1fr)] gap-4 rounded-2xl border border-ink/10 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-irhal-red/30 hover:shadow-xl"
                  href={result.href}
                  key={result.id}
                >
                  <span className="relative grid aspect-square overflow-hidden rounded-xl bg-paper-deep text-irhal-red">
                    {result.image ? (
                      <Image
                        alt=""
                        className="object-cover transition duration-500 group-hover:scale-105"
                        fill
                        sizes="256px"
                        src={result.image}
                      />
                    ) : (
                      <MapPin aria-hidden="true" className="m-auto h-6 w-6" />
                    )}
                  </span>
                  <span className="min-w-0 py-1">
                    <span className="inline-flex rounded-full bg-irhal-red/10 px-2.5 py-1 text-[11px] font-black text-irhal-red">
                      {result.label}
                    </span>
                    <span className="mt-2 block truncate text-xl font-black text-travel-navy">
                      {result.title}
                    </span>
                    <span className="mt-1 block truncate text-sm font-bold text-ink/55">
                      {result.subtitle}
                    </span>
                    {result.description ? (
                      <span className="mt-2 line-clamp-2 block text-sm leading-6 text-ink/65">
                        {result.description}
                      </span>
                    ) : null}
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-black text-irhal-red">
                      {isArabic ? "عرض النتيجة" : "Open result"}
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 rtl:rotate-180"
                      />
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-paper-deep p-8 text-center">
              <p className="text-lg font-black text-ink">{t.noResults}</p>
            </div>
          )}
        </section>
      </main>
    </PageShell>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return <SearchPageContent searchParams={searchParams} />;
}
