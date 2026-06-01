import {
  CalendarDays,
  CheckCircle2,
  Compass,
  ExternalLink,
  Heart,
  MapPin,
  Route,
  Share2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CityGuide } from "@/lib/city-data";
import { getGuideItemImage, getGuideItemImages } from "@/lib/city-presentation";
import type { GuideItem } from "@/lib/guide-items";
import {
  getGuideItems,
  guideKindOrder,
  kindPlural,
  kindSingular,
  localizeGuideItem,
  pathForGuideItem,
  sectionCards,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, guideItemJsonLd } from "@/lib/seo";
import { DetailMediaGallery } from "./detail-media-gallery";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { arabicSectionCopy } from "./guide-section-grid";
import { GuideItemRail } from "./guide-item-card";
import { JsonLd } from "./json-ld";
import { PageShell } from "./page-shell";

const priceSymbol = (value?: string) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  if (/luxury|premium|upscale|five[ -]?star|5[ -]?star/.test(normalized))
    return "$$$$";
  if (/expensive/.test(normalized)) return "$$$";
  if (/moderate|mid[ -]?range/.test(normalized)) return "$$";
  if (/budget|cheap|economy|inexpensive/.test(normalized)) return "$";
  if (/^\$+$/.test(value.trim())) return value.trim();
  return undefined;
};

const comparableText = (value?: string) =>
  value?.replace(/\s+/g, " ").trim().toLowerCase() ?? "";

export function GuideItemDetail({
  city,
  item,
  locale = "en",
}: {
  city: CityGuide;
  item: GuideItem;
  locale?: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const localePrefix = isArabic ? "/ar" : "/en";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = `${localePrefix}/city/${city.slug}`;
  const section = sectionCards.find(
    (sectionCard) => sectionCard.slug === item.sectionSlug,
  );
  const sectionTitle =
    (isArabic ? arabicSectionCopy[item.sectionSlug]?.title : undefined) ??
    section?.title ??
    item.sectionSlug;
  const visual = getGuideItemImage(item);
  const galleryImages = getGuideItemImages(item);
  const arTranslation = item.translations?.ar as
    | { overview?: string[]; address?: string }
    | undefined;
  const overviewParagraphs =
    isArabic && Array.isArray(arTranslation?.overview) && arTranslation.overview.length > 0
      ? arTranslation.overview
      : item.originalContent;
  const overviewAddress =
    isArabic && arTranslation?.address
      ? arTranslation.address
      : item.originalLocation;
  const firstOverviewParagraph = overviewParagraphs?.[0];
  const leadParagraph =
    comparableText(firstOverviewParagraph) &&
    comparableText(item.description) &&
    comparableText(item.description) !== comparableText(firstOverviewParagraph)
      ? item.description
      : undefined;

  const copy = isArabic
    ? {
        addToWishlist: "أضف إلى المفضلة",
        address: "العنوان",
        area: "المنطقة",
        checkMap: "تحقق من الموقع على الخريطة",
        cityGuide: "دليل المدينة",
        freePlanning: "تخطيط أسهل",
        exploreAll: "عرض الكل",
        galleryClose: "إغلاق معرض الصور",
        galleryNext: "الصورة التالية",
        galleryPrevious: "الصورة السابقة",
        galleryViewAll: "عرض الصور",
        goodToKnow: "معلومات مفيدة",
        itineraries: "عرض المسارات",
        mapReady: "موقع جاهز على الخريطة",
        moreToExplore: "المزيد للاستكشاف",
        nearbyIdeas: "اقتراحات قريبة",
        neighborhoodPlan: "خطط حسب المنطقة",
        openMap: "افتح الخريطة",
        overview: "نظرة عامة",
        planBody: `ابنِ مسارك، واعثر على الطعام الحلال وأماكن الصلاة، ونظّم أيامك في ${cityName}.`,
        planStop: "خطط لهذه المحطة",
        planStopBody: "احفظ المكان ضمن مسارك، وراجِع الموقع والوقت المناسب قبل الانطلاق.",
        planTitle: "خطط رحلتك",
        price: "السعر",
        quickFacts: "حقائق سريعة",
        railSubtitle: `واصل استكشاف ${cityName} وأضف المزيد من المحطات إلى خطتك.`,
        share: "مشاركة",
        tip1: "تأكد من ساعات العمل وقواعد التذاكر ومواعيد العطلات قبل زيارتك.",
        tip2: `للخطط الطويلة عبر المدينة، اجمع المواقع القريبة معًا حتى لا يستهلك ازدحام ${cityName} يومك.`,
        type: "النوع",
        updatedInfo: "معلومات عملية",
        visitInfo: "معلومات الزيارة",
        youMightLike: "قد يعجبك أيضًا",
      }
    : {
        addToWishlist: "Add to wishlist",
        address: "Address",
        area: "Area",
        checkMap: "Check location on map",
        cityGuide: "City guide",
        freePlanning: "Easier planning",
        exploreAll: "Explore all",
        galleryClose: "Close gallery",
        galleryNext: "Next image",
        galleryPrevious: "Previous image",
        galleryViewAll: "View photos",
        goodToKnow: "Good to know",
        itineraries: "View itineraries",
        mapReady: "Map-ready location",
        moreToExplore: "More to explore",
        nearbyIdeas: "Nearby ideas",
        neighborhoodPlan: "Plan by area",
        openMap: "Open map",
        overview: "Overview",
        planBody: `Build a route, find halal food and prayer spots, and map your days in ${cityName}.`,
        planStop: "Plan this stop",
        planStopBody: "Save it into your route, check the location, and group nearby stops before you go.",
        planTitle: "Plan your trip",
        price: "Price",
        quickFacts: "Quick facts",
        railSubtitle: `Keep exploring ${cityName} and add more stops to your plan.`,
        share: "Share",
        tip1: "Check opening hours, ticket rules, and holiday schedules close to your visit.",
        tip2: `For longer cross-city plans, group nearby stops together so ${cityName} traffic does not eat the day.`,
        type: "Type",
        updatedInfo: "Practical info",
        visitInfo: "Visit information",
        youMightLike: "You might also like",
      };

  const lang = isArabic ? "ar" : "en";
  const itemLabels = isArabic
    ? { discover: "اكتشف", map: "الخريطة", savePrefix: "حفظ", verified: "تم التحقق" }
    : { discover: "Discover", map: "Map", savePrefix: "Save", verified: "Verified" };

  // Quick facts (curated, never a raw column dump).
  const price = priceSymbol(item.budget) ?? priceSymbol(item.category);
  const typeValue = priceSymbol(item.category)
    ? kindSingular[item.kind][lang]
    : item.category || kindSingular[item.kind][lang];
  const facts = [
    item.area ? { label: copy.area, value: item.area } : null,
    { label: copy.type, value: typeValue },
    price ? { label: copy.price, value: price } : null,
    overviewAddress ? { label: copy.address, value: overviewAddress } : null,
  ].filter((fact): fact is { label: string; value: string } => Boolean(fact));

  // Cross-discovery: same-kind first ("more like this"), then other categories.
  const allItems = getGuideItems(city);
  const relatedKinds = guideKindOrder.filter(
    (kind) =>
      kind !== item.kind && allItems.some((other) => other.kind === kind),
  );

  const sidebarItems = relatedKinds
    .flatMap((kind) =>
      allItems.filter((other) => other.kind === kind).slice(0, 2),
    )
    .slice(0, 6)
    .map((other) => {
      const localized = localizeGuideItem(other, locale);
      return {
        title: localized.title,
        category: kindSingular[other.kind][lang],
        href: `${localePrefix}${pathForGuideItem(city, other)}`,
        image: getGuideItemImage(localized).image,
      };
    });

  const railKinds = [item.kind, ...relatedKinds].slice(0, 3);
  const relatedRails = railKinds
    .map((kind) => {
      const kindItems = allItems.filter(
        (other) => other.kind === kind && other.slug !== item.slug,
      );
      if (kindItems.length === 0) return null;
      return {
        kind,
        href: `${localePrefix}/city/${city.slug}/section/${kindItems[0].sectionSlug}`,
        items: kindItems.slice(0, 10).map((other) => localizeGuideItem(other, locale)),
      };
    })
    .filter(
      (rail): rail is { kind: GuideItem["kind"]; href: string; items: GuideItem[] } =>
        Boolean(rail),
    );

  const railTitle = (kind: GuideItem["kind"]) =>
    isArabic
      ? `المزيد من ${kindPlural[kind].ar} في ${cityName}`
      : `More ${kindPlural[kind].en} in ${cityName}`;

  return (
    <PageShell
      breadcrumbs={[
        { label: isArabic ? "الرئيسية" : "Home", href: isArabic ? "/ar" : "/" },
        { label: cityName, href: cityBasePath },
        {
          label: sectionTitle,
          href: `${cityBasePath}/section/${item.sectionSlug}`,
        },
        { label: item.title },
      ]}
      locale={locale}
    >
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: city.name, path: `/city/${city.slug}` },
            {
              name: section?.title ?? item.sectionSlug,
              path: `/city/${city.slug}/section/${item.sectionSlug}`,
            },
            {
              name: item.title,
              path: `/city/${city.slug}/${item.kind}/${item.slug}`,
            },
          ], locale),
          guideItemJsonLd({
            citySlug: city.slug,
            cityName: city.name,
            country: city.country,
            kind: item.kind,
            slug: item.slug,
            title: item.title,
            description: overviewParagraphs?.[0] ?? item.description,
            image: visual.image,
            address: overviewAddress,
            locale,
          }),
        ]}
      />
      <main className="bg-white" dir={isArabic ? "rtl" : "ltr"}>
        <section className="border-b border-ink/10 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 lg:py-10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <h1 className="max-w-5xl text-4xl font-black tracking-tight text-travel-navy md:text-5xl">
                  {item.title}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold text-travel-navy/75">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck aria-hidden="true" className="h-4 w-4 text-coastal" />
                    {copy.cityGuide}
                  </span>
                  <span className="text-ink/30">•</span>
                  <Link
                    className="hover:text-irhal-red hover:underline"
                    href={`${cityBasePath}/section/${item.sectionSlug}`}
                  >
                    {sectionTitle}
                  </Link>
                  {item.area ? (
                    <>
                      <span className="text-ink/30">•</span>
                      <span>{item.area}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" type="button" variant="ghost">
                  <Heart aria-hidden="true" />
                  {copy.addToWishlist}
                </Button>
                <Button size="sm" type="button" variant="ghost">
                  <Share2 aria-hidden="true" />
                  {copy.share}
                </Button>
              </div>
            </div>

            <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
              <div className="min-w-0 space-y-8">
                <DetailMediaGallery
                  alt={item.imageAlt}
                  dir={isArabic ? "rtl" : "ltr"}
                  images={galleryImages}
                  labels={{
                    close: copy.galleryClose,
                    next: copy.galleryNext,
                    previous: copy.galleryPrevious,
                    viewAll: copy.galleryViewAll,
                  }}
                />

                {leadParagraph ? (
                  <p className="max-w-4xl text-lg font-bold leading-8 text-travel-navy">
                    {leadParagraph}
                  </p>
                ) : null}

                <Card className="overflow-hidden shadow-none">
                  <CardContent className="grid gap-0 p-0 sm:grid-cols-3">
                    {[
                      {
                        icon: CheckCircle2,
                        title: copy.freePlanning,
                        body: copy.tip1,
                      },
                      {
                        icon: MapPin,
                        title: copy.mapReady,
                        body: item.area || cityName,
                      },
                      {
                        icon: Sparkles,
                        title: copy.nearbyIdeas,
                        body: copy.tip2,
                      },
                    ].map((highlight) => (
                      <div
                        className="border-b border-ink/10 p-5 last:border-b-0 sm:border-b-0 sm:border-e"
                        key={highlight.title}
                      >
                        <highlight.icon
                          aria-hidden="true"
                          className="h-7 w-7 rounded-full bg-paper-deep p-1.5 text-coastal"
                        />
                        <h2 className="mt-3 text-base font-black text-travel-navy">
                          {highlight.title}
                        </h2>
                        <p className="mt-1 line-clamp-3 text-sm leading-6 text-travel-navy/70">
                          {highlight.body}
                        </p>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <article className="border-t border-ink/10 pt-8">
                  <h2 className="text-3xl font-black tracking-tight text-travel-navy">
                    {copy.overview}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {(overviewParagraphs?.length ? overviewParagraphs : [item.description]).map(
                      (paragraph, index) => (
                        <p
                          className="max-w-3xl text-lg leading-8 text-ink/80"
                          key={`${item.slug}-para-${index}`}
                        >
                          {paragraph}
                        </p>
                      ),
                    )}
                  </div>
                </article>

                <Card className="border-l-4 border-l-coastal bg-white p-6 shadow-none rtl:border-l rtl:border-r-4 rtl:border-r-coastal">
                  <h3 className="text-xl font-black text-travel-navy">
                    {copy.goodToKnow}
                  </h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-ink/70">
                    <p>{copy.tip1}</p>
                    <p>{copy.tip2}</p>
                  </div>
                </Card>
              </div>

              <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
                <Card className="overflow-hidden rounded-2xl border-ink/15 shadow-[0_22px_70px_rgba(17,24,39,0.12)]">
                  <CardContent className="p-5">
                    <p className="text-sm font-bold text-travel-navy/70">
                      {copy.planStop}
                    </p>
                    <p className="mt-1 text-2xl font-black text-travel-navy">
                      {item.area || sectionTitle}
                    </p>
                    <p className="mt-3 text-sm leading-6 text-travel-navy/70">
                      {copy.planStopBody}
                    </p>
                    <div className="mt-5 grid gap-3">
                      {item.mapUrl ? (
                        <Button asChild className="w-full rounded-full" size="lg" variant="blue">
                          <a href={item.mapUrl}>
                            <MapPin aria-hidden="true" />
                            {copy.checkMap}
                            <ExternalLink aria-hidden="true" />
                          </a>
                        </Button>
                      ) : null}
                      <Button asChild className="w-full rounded-full" size="lg" variant="outline">
                        <Link href={`${cityBasePath}/itineraries`}>
                          <Route aria-hidden="true" />
                          {copy.itineraries}
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-6 space-y-4 border-t border-ink/10 pt-5">
                      {[
                        {
                          Icon: CalendarDays,
                          title: copy.updatedInfo,
                          body: copy.tip1,
                        },
                        {
                          Icon: Compass,
                          title: copy.neighborhoodPlan,
                          body: item.area || cityName,
                        },
                      ].map(({ Icon, title, body }) => (
                        <div className="flex gap-3" key={String(title)}>
                          <Icon
                            aria-hidden="true"
                            className="mt-0.5 h-5 w-5 shrink-0 text-coastal"
                          />
                          <div>
                            <p className="text-sm font-black text-travel-navy">{title}</p>
                            <p className="mt-0.5 text-sm leading-5 text-travel-navy/65">
                              {body}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="p-5 shadow-none">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                    {copy.quickFacts}
                  </p>
                  <dl className="mt-3 divide-y divide-ink/10">
                    {facts.map((fact) => (
                      <div
                        className="flex items-start justify-between gap-4 py-3"
                        key={fact.label}
                      >
                        <dt className="text-sm font-bold text-ink/55">
                          {fact.label}
                        </dt>
                        <dd className="max-w-[62%] text-end text-sm font-bold text-travel-navy">
                          {fact.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>

                {sidebarItems.length > 0 ? (
                  <Card className="p-5 shadow-none">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                      {copy.moreToExplore}
                    </p>
                    <ul className="mt-3 flex flex-col gap-1">
                      {sidebarItems.map((related) => (
                        <li key={related.href}>
                          <Link
                            className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-paper-deep"
                            href={related.href}
                          >
                            <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-paper-deep">
                              <Image
                                alt={related.title}
                                className="object-cover"
                                fill
                                sizes="64px"
                                src={related.image}
                              />
                            </span>
                            <span className="min-w-0">
                              <span className="block line-clamp-2 text-sm font-bold text-travel-navy group-hover:text-irhal-red">
                                {related.title}
                              </span>
                              <span className="mt-0.5 block truncate text-xs font-bold uppercase tracking-wide text-coastal">
                                {related.category}
                              </span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ) : null}
              </aside>
            </div>
          </div>
        </section>

        {/* Cross-discovery rails */}
        {relatedRails.length > 0 ? (
          <section className="border-t border-ink/10 bg-white pt-6">
            <div className="mx-auto max-w-7xl px-5 pt-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                {copy.youMightLike}
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
                pathPrefix={localePrefix}
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
