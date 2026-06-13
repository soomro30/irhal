import { Compass, MapPin, Route } from "lucide-react";
import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GuideContent } from "@/components/guide-content";
import { DiscoverPill } from "@/components/discover-action";
import {
  GuideItemRail,
  sortGuideItemsForCards,
} from "@/components/guide-item-card";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCityBySlug } from "@/lib/city-source";
import {
  getGuideArticle,
  getGuideArticlesForSection,
  getGuideItems,
  getLocalizedGuideSectionCopy,
  guideKindOrder,
  hasArabicGuideItemCopy,
  isPublicGuideSection,
  kindPlural,
  localizeGuideArticle,
  localizeGuideItem,
  type GuideItem,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

type Props = {
  params: Promise<{ city: string; section: string; article: string }>;
};

export async function generateStaticParams() {
  return [];
}

type PageLocale = "en" | "ar";

const sameText = (first: string, second: string) =>
  first.trim().replace(/\s+/g, " ") === second.trim().replace(/\s+/g, " ");

export async function generateGuideArticleMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, section, article: articleSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const article = city
    ? getGuideArticle(city, section, articleSlug)
    : undefined;
  if (!city || !article || !isPublicGuideSection(section)) return {};

  const displayArticle = localizeGuideArticle(article, locale);
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (locale === "ar" && city.slug === "karachi" ? "كراتشي" : city.name);
  const pathPrefix = locale === "ar" ? "/ar" : "/en";

  return pageMetadata({
    title: `${displayArticle.title} | ${cityName}`,
    description: displayArticle.summary,
    path: `${pathPrefix}/city/${city.slug}/section/${section}/${displayArticle.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateGuideArticleMetadata(props);
}

export async function GuideArticlePageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, section, article: articleSlug } = await params;
  const city = await getCityBySlug(citySlug);
  const article = city
    ? getGuideArticle(city, section, articleSlug)
    : undefined;
  if (!city || !article || !isPublicGuideSection(section)) notFound();

  const siteSettings = await getSiteSettings();
  const guideCardSortMode = siteSettings.guideCardSortMode;
  const isArabic = locale === "ar";
  const displayArticle = localizeGuideArticle(article, locale);
  const sectionArticles = getGuideArticlesForSection(city, section).map(
    (item) => localizeGuideArticle(item, locale),
  );
  const relatedArticles = sectionArticles.filter(
    (item) => item.slug !== displayArticle.slug,
  );
  const sectionTitle = getLocalizedGuideSectionCopy(
    city,
    section,
    locale,
  ).title;
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = isArabic
    ? `/ar/city/${city.slug}`
    : `/en/city/${city.slug}`;
  const copy = isArabic
    ? {
        articleBadge: "مقال من دليل المدينة",
        browseMore: `المزيد من ${sectionTitle}`,
        continueReading: "واصل القراءة",
        exploreAll: "عرض الكل",
        itemRailSubtitle: `أضف محطات عملية إلى خطتك في ${cityName} من الأماكن والفنادق والتسوق والطعام.`,
        map: "افتح خريطة المدينة",
        moreArticles: "مقالات أخرى",
        planBody: `ابنِ مسارك، واعثر على الطعام الحلال وأماكن الصلاة، ونظّم أيامك في ${cityName}.`,
        planTitle: "خطط رحلتك",
        readArticle: "اقرأ المقال كاملًا",
        route: "عرض المسارات",
      }
    : {
        articleBadge: "City guide article",
        browseMore: `More from ${sectionTitle}`,
        continueReading: "Continue reading",
        exploreAll: "Explore all",
        itemRailSubtitle: `Add practical stops to your ${cityName} plan across places, hotels, shopping, and food.`,
        map: "Open city map",
        moreArticles: "More articles",
        planBody: `Build a route, find halal food and prayer spots, and map your days in ${cityName}.`,
        planTitle: "Plan your trip",
        readArticle: "Read full article",
        route: "View itineraries",
      };
  const dedupedContentBlocks =
    displayArticle.blocks[0]?.type === "paragraph" &&
    sameText(displayArticle.blocks[0].text, displayArticle.summary)
      ? displayArticle.blocks.slice(1)
      : displayArticle.blocks;
  const contentBlocks =
    dedupedContentBlocks.length > 0
      ? dedupedContentBlocks
      : displayArticle.blocks;
  const articleImageUrl = displayArticle.imageUrl?.trim();
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
  const allItems = getGuideItems(city);
  const preferredRails: GuideItem["kind"][] = [
    "place",
    "hotel",
    "shopping",
    "restaurant",
  ];
  const railItemsForKind = (kind: GuideItem["kind"]) =>
    allItems
      .filter((item) => item.kind === kind)
      .filter((item) => !isArabic || hasArabicGuideItemCopy(item));
  const railKinds = [
    ...preferredRails,
    ...guideKindOrder.filter((kind) => !preferredRails.includes(kind)),
  ]
    .filter((kind) => railItemsForKind(kind).length > 0)
    .slice(0, 4);
  const relatedRails = railKinds.map((kind) => {
    const kindItems = sortGuideItemsForCards(
      railItemsForKind(kind),
      guideCardSortMode,
    );
    return {
      href: `${cityBasePath}/section/${kindItems[0].sectionSlug}`,
      items: kindItems
        .slice(0, 10)
        .map((item) => localizeGuideItem(item, locale)),
      kind,
    };
  });
  const railTitle = (kind: GuideItem["kind"]) =>
    isArabic
      ? `أبرز ${kindPlural[kind].ar} في ${cityName}`
      : `Top ${kindPlural[kind].en} in ${cityName}`;

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        {
          label: sectionTitle,
          href: `${cityBasePath}/section/${section}`,
        },
        { label: displayArticle.title },
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
              path: `${cityBasePath}/section/${section}`,
            },
            {
              name: displayArticle.title,
              path: `${cityBasePath}/section/${section}/${displayArticle.slug}`,
            },
          ],
          locale,
        )}
      />
      <main dir={isArabic ? "rtl" : "ltr"}>
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-10 md:py-12">
            <Badge className="w-fit" variant="secondary">
              {copy.articleBadge}
            </Badge>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-ink md:text-5xl">
              {displayArticle.title}
            </h1>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-ink/65 md:text-xl md:leading-9">
              {displayArticle.summary}
            </p>
          </div>
        </section>

        <section className="border-t border-ink/10 bg-paper py-10 lg:py-12">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <article className="min-w-0 overflow-hidden rounded-lg border border-ink/10 bg-white">
              {articleImageUrl ? (
                <div className="relative aspect-[16/9] w-full bg-paper-deep">
                  <Image
                    alt={displayArticle.imageAlt ?? displayArticle.title}
                    className="object-cover"
                    fill
                    priority
                    quality={90}
                    sizes="(min-width: 1024px) 1040px, 100vw"
                    src={articleImageUrl}
                  />
                </div>
              ) : null}
              <div className="px-5 py-6 md:px-8">
                <GuideContent blocks={contentBlocks} locale={locale} />
              </div>
            </article>

            <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
              {relatedArticles.length > 0 ? (
                <Card className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                    {copy.moreArticles}
                  </p>
                  <ul className="mt-3 flex flex-col gap-1">
                    {relatedArticles.slice(0, 7).map((related) => (
                      <li key={related.slug}>
                        <Link
                          className="group block rounded-lg p-3 transition hover:bg-paper-deep"
                          href={`${cityBasePath}/section/${section}/${related.slug}`}
                        >
                          <span className="block text-sm font-bold leading-5 text-travel-navy group-hover:text-irhal-red">
                            {related.title}
                          </span>
                          <span className="mt-1 line-clamp-2 block text-xs leading-5 text-ink/60">
                            {related.summary}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              <Card className="border-0 bg-ink p-6 text-white">
                <Compass
                  aria-hidden="true"
                  className="h-6 w-6 text-irhal-orange"
                />
                <h3 className="mt-3 text-lg font-black">{copy.planTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-white/75">
                  {copy.planBody}
                </p>
                <div className="mt-5 flex flex-col gap-2">
                  <Button asChild size="sm" variant="orange">
                    <Link href={`${cityBasePath}/itineraries`}>
                      <Route aria-hidden="true" />
                      {copy.route}
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="quiet">
                    <a href={city.mapUrl}>
                      <MapPin aria-hidden="true" />
                      {copy.map}
                    </a>
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        </section>

        {relatedArticles.length > 0 ? (
          <section className="border-t border-ink/10 bg-white py-12">
            <div className="mx-auto max-w-7xl px-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                {copy.continueReading}
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-ink md:text-3xl">
                {copy.browseMore}
              </h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedArticles.slice(0, 6).map((related) => (
                  <Link
                    href={`${cityBasePath}/section/${section}/${related.slug}`}
                    key={related.slug}
                  >
                    <Card className="h-full bg-white transition hover:-translate-y-0.5 hover:border-coastal/40">
                      <CardContent className="flex h-full flex-col p-6">
                        <h3 className="text-lg font-black leading-tight text-ink">
                          {related.title}
                        </h3>
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/70">
                          {related.summary}
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
          </section>
        ) : null}

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
            pathPrefix={isArabic ? "/ar" : "/en"}
            preserveOrder
            sortMode={guideCardSortMode}
            subtitle={copy.itemRailSubtitle}
            title={railTitle(rail.kind)}
          />
        ))}
      </main>
    </PageShell>
  );
}

export default async function GuideArticlePage(props: Props) {
  return <GuideArticlePageContent {...props} />;
}
