import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DiscoverPill } from "@/components/discover-action";
import {
  GuideItemGrid,
  GuideItemRail,
  sortGuideItemsForCards,
} from "@/components/guide-item-card";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { SectionSidebar } from "@/components/section-sidebar";
import { sectionImage } from "@/components/guide-section-grid";
import { Card, CardContent } from "@/components/ui/card";
import { getGuideSection } from "@/lib/city-data";
import { getGuideItemImage } from "@/lib/city-presentation";
import { getCityBySlug } from "@/lib/city-source";
import {
  getGuideItems,
  getGuideArticlesForSection,
  getGuideItemsForSection,
  getLocalizedGuideSectionCopy,
  guideKindOrder,
  hasArabicGuideItemCopy,
  isPublicGuideSection,
  kindPlural,
  kindSingular,
  localizeGuideArticle,
  localizeGuideItem,
  pathForGuideItem,
  type GuideItem,
  type GuideItemKind,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, localizedCityName, pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

const PAGE_SIZE = 24;

const clampPage = (raw: string | undefined, totalPages: number) => {
  const parsed = Number.parseInt(raw ?? "1", 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, totalPages);
};

// Compact, accessible page list with ellipses (e.g. 1 … 4 5 6 … 12).
const buildPageList = (
  current: number,
  total: number,
): (number | "ellipsis")[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (page - previous > 1) result.push("ellipsis");
    result.push(page);
    previous = page;
  }
  return result;
};

type Props = {
  params: Promise<{ city: string; section: string; page?: string }>;
};

export async function generateStaticParams() {
  return [];
}

type PageLocale = "en" | "ar";

export async function generateGuideSectionMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, page, section: sectionSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideSection = city ? getGuideSection(city, sectionSlug) : undefined;
  if (!city || !guideSection || !isPublicGuideSection(sectionSlug)) return {};

  const cityName = localizedCityName(city, locale);
  const sectionCopy = getLocalizedGuideSectionCopy(city, sectionSlug, locale);
  const sectionTitle = sectionCopy.title;
  const description = sectionCopy.summary;
  const totalItems = getGuideItemsForSection(city, sectionSlug).length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = clampPage(page, totalPages);
  const pageSuffix = currentPage > 1 ? `/p/${currentPage}` : "";

  return pageMetadata({
    title: `${sectionTitle} | ${cityName}`,
    description,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/section/${guideSection.slug}${pageSuffix}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateGuideSectionMetadata(props);
}

export async function CityGuideSectionPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, page, section: sectionSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideSection = city ? getGuideSection(city, sectionSlug) : undefined;
  if (!city || !guideSection || !isPublicGuideSection(sectionSlug)) notFound();

  const siteSettings = await getSiteSettings();
  const guideCardSortMode = siteSettings.guideCardSortMode;
  const items = getGuideItemsForSection(city, sectionSlug);
  const sortedItems = sortGuideItemsForCards(items, guideCardSortMode);
  const localizedItems = sortedItems.map((item) =>
    localizeGuideItem(item, locale),
  );
  const isArabic = locale === "ar";
  const articles = getGuideArticlesForSection(city, sectionSlug);
  const localizedArticles = articles.map((article) =>
    localizeGuideArticle(article, locale),
  );
  const articleTitleKeys = new Set(
    localizedItems.map((item) => item.title.trim().toLowerCase()),
  );
  const supplementalArticles = localizedArticles.filter(
    (article) => !articleTitleKeys.has(article.title.trim().toLowerCase()),
  );
  const localePrefix = isArabic ? "/ar" : "/en";

  const allItems = getGuideItems(city);
  const currentKind = items[0]?.kind;
  const itemsByKind = (kind: GuideItemKind) =>
    allItems
      .filter((item) => item.kind === kind)
      .filter((item) => !isArabic || hasArabicGuideItemCopy(item));
  const relatedKinds = guideKindOrder.filter(
    (kind) => kind !== currentKind && itemsByKind(kind).length > 0,
  );

  const relatedItemHref = (item: GuideItem) =>
    `${localePrefix}${pathForGuideItem(city, item)}`;

  const sidebarRelatedItems = relatedKinds
    .flatMap((kind) =>
      sortGuideItemsForCards(itemsByKind(kind), guideCardSortMode).slice(0, 2),
    )
    .slice(0, 6)
    .map((item) => {
      const localized = localizeGuideItem(item, locale);
      return {
        title: localized.title,
        category: kindSingular[item.kind][isArabic ? "ar" : "en"],
        href: relatedItemHref(item),
        image: getGuideItemImage(localized).image,
      };
    });

  const relatedRails = relatedKinds.slice(0, 3).map((kind) => {
    const kindItems = sortGuideItemsForCards(
      itemsByKind(kind),
      guideCardSortMode,
    );
    return {
      kind,
      href: `${localePrefix}/city/${city.slug}/section/${kindItems[0].sectionSlug}`,
      items: kindItems.map((item) => localizeGuideItem(item, locale)),
    };
  });
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = `${localePrefix}/city/${city.slug}`;

  const totalItems = localizedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage = clampPage(page, totalPages);
  const pageStartIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = localizedItems.slice(
    pageStartIndex,
    pageStartIndex + PAGE_SIZE,
  );
  const pageList = buildPageList(currentPage, totalPages);
  const sectionPath = `${cityBasePath}/section/${sectionSlug}`;
  const pageHref = (page: number) =>
    page <= 1 ? sectionPath : `${sectionPath}/p/${page}`;
  const sectionCopy = getLocalizedGuideSectionCopy(city, sectionSlug, locale);
  const sectionTitle = sectionCopy.title;
  const sectionSummary = sectionCopy.summary;
  const itemLabels = isArabic
    ? {
        discover: "اكتشف",
        map: "الخريطة",
        savePrefix: "حفظ",
        verified: "تم التحقق",
      }
    : {
        discover: "Discover",
        map: "Map",
        savePrefix: "Save",
        verified: "Verified",
      };
  const copy = isArabic
    ? {
        badge: "قسم دليل المدينة",
        exploreAll: "عرض الكل",
        itemsHeading: `أبرز الأماكن في ${cityName}`,
        itemsIntro:
          "تصفّح الأبرز أدناه، ثم افتح أي مكان للاطلاع على الخريطة وملاحظات المنطقة والتفاصيل العملية.",
        keepExploring: `اكتشف المزيد في ${cityName}`,
        moreArticles: `المزيد من ${sectionTitle}`,
        nextPage: "التالي",
        prevPage: "السابق",
        railSubtitle: `واصل استكشاف ${cityName} وأضف المزيد من المحطات إلى خطتك.`,
        readArticle: "اقرأ المقال كاملًا",
      }
    : {
        badge: "City guide section",
        exploreAll: "Explore all",
        itemsHeading: `Top picks in ${cityName}`,
        itemsIntro:
          "Browse the highlights below, then open any place for maps, area notes, and practical details.",
        keepExploring: `Keep exploring ${cityName}`,
        moreArticles: `More ${sectionTitle}`,
        nextPage: "Next",
        prevPage: "Previous",
        railSubtitle: `Keep exploring ${cityName} and add more stops to your plan.`,
        readArticle: "Read full article",
      };
  const showingLabel = (() => {
    const from = totalItems === 0 ? 0 : pageStartIndex + 1;
    const to = Math.min(pageStartIndex + PAGE_SIZE, totalItems);
    const noun = kindPlural[items[0]?.kind ?? "place"][isArabic ? "ar" : "en"];
    return isArabic
      ? `عرض ${from}–${to} من ${totalItems} ${noun}`
      : `Showing ${from}–${to} of ${totalItems} ${noun}`;
  })();
  const railTitle = (kind: GuideItemKind) =>
    isArabic
      ? `المزيد من ${kindPlural[kind].ar} في ${cityName}`
      : `More ${kindPlural[kind].en} in ${cityName}`;

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        { label: sectionTitle },
      ]}
      locale={locale}
    >
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: city.name, path: cityBasePath },
            {
              name: sectionTitle,
              path: `${cityBasePath}/section/${guideSection.slug}`,
            },
          ],
          locale,
        )}
      />
      <main dir={isArabic ? "rtl" : "ltr"}>
        <section className="border-b border-ink/10 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-12">
            <div className="max-w-4xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                {copy.badge}
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-ink md:text-5xl">
                {sectionTitle}
              </h1>
              <p className="mt-6 text-xl leading-9 text-ink/65">
                {sectionSummary}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-paper py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-5">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                {localizedItems.length > 0 ? (
                  <section>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                          {copy.badge}
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-ink md:text-3xl">
                          {copy.itemsHeading}
                        </h2>
                      </div>
                      <p className="text-sm font-bold uppercase tracking-wide text-ink/55">
                        {showingLabel}
                      </p>
                    </div>
                    <p className="mt-4 max-w-3xl text-base leading-7 text-ink/65">
                      {copy.itemsIntro}
                    </p>
                    <div className="mt-8">
                      <GuideItemGrid
                        city={city}
                        cityName={cityName}
                        items={pageItems}
                        labels={itemLabels}
                        locale={locale}
                        pathPrefix={localePrefix}
                        preserveOrder
                        sortMode={guideCardSortMode}
                      />
                    </div>

                    {totalPages > 1 ? (
                      <nav
                        aria-label={isArabic ? "ترقيم الصفحات" : "Pagination"}
                        className="mt-10 flex items-center justify-center gap-1.5"
                      >
                        {currentPage > 1 ? (
                          <Link
                            className="inline-flex h-10 items-center gap-1 rounded-md border border-ink/15 px-3 text-sm font-bold text-ink transition hover:border-ink/40"
                            href={pageHref(currentPage - 1)}
                            rel="prev"
                          >
                            <ChevronLeft
                              aria-hidden="true"
                              className="h-4 w-4 rtl:rotate-180"
                            />
                            {copy.prevPage}
                          </Link>
                        ) : (
                          <span className="inline-flex h-10 items-center gap-1 rounded-md border border-ink/10 px-3 text-sm font-bold text-ink/30">
                            <ChevronLeft
                              aria-hidden="true"
                              className="h-4 w-4 rtl:rotate-180"
                            />
                            {copy.prevPage}
                          </span>
                        )}

                        {pageList.map((entry, index) =>
                          entry === "ellipsis" ? (
                            <span
                              className="inline-flex h-10 w-10 items-center justify-center text-sm font-bold text-ink/40"
                              key={`ellipsis-${index}`}
                            >
                              …
                            </span>
                          ) : (
                            <Link
                              aria-current={
                                entry === currentPage ? "page" : undefined
                              }
                              className={
                                entry === currentPage
                                  ? "inline-flex h-10 w-10 items-center justify-center rounded-md bg-irhal-red text-sm font-black text-white"
                                  : "inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/15 text-sm font-bold text-ink transition hover:border-ink/40"
                              }
                              href={pageHref(entry)}
                              key={entry}
                            >
                              {entry}
                            </Link>
                          ),
                        )}

                        {currentPage < totalPages ? (
                          <Link
                            className="inline-flex h-10 items-center gap-1 rounded-md border border-ink/15 px-3 text-sm font-bold text-ink transition hover:border-ink/40"
                            href={pageHref(currentPage + 1)}
                            rel="next"
                          >
                            {copy.nextPage}
                            <ChevronRight
                              aria-hidden="true"
                              className="h-4 w-4 rtl:rotate-180"
                            />
                          </Link>
                        ) : (
                          <span className="inline-flex h-10 items-center gap-1 rounded-md border border-ink/10 px-3 text-sm font-bold text-ink/30">
                            {copy.nextPage}
                            <ChevronRight
                              aria-hidden="true"
                              className="h-4 w-4 rtl:rotate-180"
                            />
                          </span>
                        )}
                      </nav>
                    ) : null}

                    {supplementalArticles.length > 0 ? (
                      <div className="mt-10">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                          {copy.moreArticles}
                        </p>
                        <div className="mt-4 grid gap-5 sm:grid-cols-2">
                          {supplementalArticles.map((article) => (
                            <Link
                              className="group block h-full"
                              href={`${cityBasePath}/section/${sectionSlug}/${article.slug}`}
                              key={article.slug}
                            >
                              <Card className="flex h-full flex-col rounded-lg border-ink/10 bg-white shadow-none transition group-hover:border-irhal-red/35">
                                <div className="relative mx-4 mt-4 h-[174px] overflow-hidden rounded-lg bg-paper-deep shadow-sm transition duration-300 group-hover:shadow-[0_14px_38px_rgba(17,17,17,0.10)]">
                                  <Image
                                    alt={
                                      article.imageAlt ??
                                      `${article.title} guide for ${cityName}`
                                    }
                                    className="object-cover transition duration-500 group-hover:scale-105"
                                    fill
                                    quality={90}
                                    sizes="(min-width: 1280px) 760px, (min-width: 640px) 72vw, 100vw"
                                    src={
                                      article.imageUrl ||
                                      sectionImage(sectionSlug)
                                    }
                                  />
                                  <span className="absolute left-3 top-3 max-w-[80%] truncate rounded-md bg-[#16325c] px-2.5 py-1 text-xs font-bold leading-none text-white rtl:left-auto rtl:right-3">
                                    {sectionTitle}
                                  </span>
                                </div>
                                <CardContent className="flex flex-1 flex-col p-4">
                                  <h3 className="line-clamp-2 text-lg font-bold leading-6 text-travel-navy transition group-hover:text-irhal-red">
                                    {article.title}
                                  </h3>
                                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-travel-navy/80">
                                    {article.summary}
                                  </p>
                                  <div className="mt-auto pt-5">
                                    <DiscoverPill
                                      label={isArabic ? "اكتشف" : "Discover"}
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </section>
                ) : localizedArticles.length > 0 ? (
                  <section className="grid gap-5 sm:grid-cols-2">
                    {localizedArticles.map((article) => (
                      <Link
                        className="group block h-full"
                        href={`${cityBasePath}/section/${sectionSlug}/${article.slug}`}
                        key={article.slug}
                      >
                        <Card className="flex h-full flex-col rounded-lg border-ink/10 bg-white shadow-none transition group-hover:border-irhal-red/35">
                          <div className="relative mx-4 mt-4 h-[174px] overflow-hidden rounded-lg bg-paper-deep shadow-sm transition duration-300 group-hover:shadow-[0_14px_38px_rgba(17,17,17,0.10)]">
                            <Image
                              alt={
                                article.imageAlt ??
                                `${article.title} guide for ${cityName}`
                              }
                              className="object-cover transition duration-500 group-hover:scale-105"
                              fill
                              quality={90}
                              sizes="(min-width: 1280px) 760px, (min-width: 640px) 72vw, 100vw"
                              src={
                                article.imageUrl || sectionImage(sectionSlug)
                              }
                            />
                            <span className="absolute left-3 top-3 max-w-[80%] truncate rounded-md bg-[#16325c] px-2.5 py-1 text-xs font-bold leading-none text-white rtl:left-auto rtl:right-3">
                              {sectionTitle}
                            </span>
                          </div>
                          <CardContent className="flex flex-1 flex-col p-4">
                            <h3 className="line-clamp-2 text-lg font-bold leading-6 text-travel-navy transition group-hover:text-irhal-red">
                              {article.title}
                            </h3>
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-travel-navy/80">
                              {article.summary}
                            </p>
                            <div className="mt-auto pt-5">
                              <DiscoverPill
                                label={isArabic ? "اكتشف" : "Discover"}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </section>
                ) : null}
              </div>

              <SectionSidebar
                city={city}
                cityBasePath={cityBasePath}
                cityName={cityName}
                currentSlug={sectionSlug}
                locale={locale}
                mapUrl={city.mapUrl}
                relatedItems={sidebarRelatedItems}
              />
            </div>
          </div>
        </section>

        {relatedRails.length > 0 ? (
          <section className="border-t border-ink/10 bg-white pt-6">
            <div className="mx-auto max-w-7xl px-5 pt-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                {copy.keepExploring}
              </p>
            </div>
            {relatedRails.map((rail) => (
              <GuideItemRail
                actionLabel={copy.exploreAll}
                city={city}
                cityName={cityName}
                dir={isArabic ? "rtl" : "ltr"}
                href={rail.href}
                items={rail.items}
                key={rail.kind}
                labels={itemLabels}
                limit={10}
                pathPrefix={localePrefix}
                preserveOrder
                sortMode={guideCardSortMode}
                subtitle={copy.railSubtitle}
                title={railTitle(rail.kind)}
              />
            ))}
          </section>
        ) : null}
      </main>
    </PageShell>
  );
}

export default async function CityGuideSectionPage(props: Props) {
  return <CityGuideSectionPageContent {...props} />;
}
