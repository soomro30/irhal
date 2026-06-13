import {
  ArrowRight,
  ExternalLink,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DiscoverLink } from "@/components/discover-action";
import {
  GuideItemGrid,
  sortGuideItemsForCards,
} from "@/components/guide-item-card";
import { JsonLd } from "@/components/json-ld";
import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getListingsByNeighborhood,
  getNeighborhood,
  pathForListing,
} from "@/lib/city-data";
import {
  getCityHeroImage,
  getNeighbourhoodHighlights,
} from "@/lib/city-presentation";
import { getCityBySlug } from "@/lib/city-source";
import {
  guideKindOrder,
  kindPlural,
  getGuideItems,
  localizeGuideItem,
  type GuideItem,
  type GuideItemKind,
} from "@/lib/guide-items";
import {
  breadcrumbJsonLd,
  localizedCityName,
  neighborhoodJsonLd,
  pageMetadata,
} from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

type Props = {
  params: Promise<{ city: string; area: string }>;
};

export async function generateStaticParams() {
  return [];
}

type PageLocale = "en" | "ar";

const normalizeArea = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const itemMatchesNeighborhood = (
  item: GuideItem,
  neighborhood: { name: string; slug: string },
) => {
  if (item.neighborhoodSlug) {
    return item.neighborhoodSlug === neighborhood.slug;
  }

  const area = normalizeArea(item.area);
  const name = normalizeArea(neighborhood.name);
  const slug = normalizeArea(neighborhood.slug);

  return (
    Boolean(area) &&
    (area.includes(name) || area.includes(slug) || name.includes(area))
  );
};

const sectionIdForKind = (kind: GuideItemKind) => `neighborhood-${kind}`;

const arabicNumberFormatter = new Intl.NumberFormat("ar-u-nu-arab");

const arabicBestForLabel: Record<string, string> = {
  "Halal dining discovery": "استكشاف المطاعم الحلال",
  "Masjid and prayer-room discovery": "استكشاف المساجد ومرافق الصلاة",
};

const arabicClusterLabel: Record<string, string> = {
  airport: "مطار",
  business: "أعمال",
  family: "عائلي",
  food: "مطاعم",
  historic: "تراثي",
  mixed: "متنوع",
  religious: "ديني",
  shopping: "تسوق",
  waterfront: "واجهة مائية",
};

const arabicDistrictLabel: Record<string, string> = {
  "airport and malir": "المطار وملير",
  "central london": "وسط لندن",
  "east london": "شرق لندن",
  "north london": "شمال لندن",
  "south london": "جنوب لندن",
  "west london": "غرب لندن",
};

const arabicZoneLabel: Record<string, string> = {
  airport: "المطار",
  central: "وسط المدينة",
  east: "شرق المدينة",
  north: "شمال المدينة",
  south: "جنوب المدينة",
  suburban: "الضواحي",
  west: "غرب المدينة",
};

const arabicListingTypeLabel: Record<string, string> = {
  hotel: "فندق",
  "islamic-landmark": "معلم إسلامي",
  masjid: "مسجد",
  place: "مكان",
  "prayer-area": "مصلى",
  restaurant: "مطعم",
  shopping: "تسوق",
  tour: "جولة",
};

const arabicLiveMapQueryLabel: Record<string, string> = {
  "Halal restaurants": "المطاعم الحلال",
  "Masjids and prayer rooms": "المساجد ومرافق الصلاة",
  "Masjids nearby": "المساجد القريبة",
  "Places nearby": "الأماكن القريبة",
  "Restaurants nearby": "المطاعم القريبة",
};

const normalizedLabelKey = (value: string) => value.trim().toLowerCase();

const localizedMappedLabel = (
  value: string,
  labels: Record<string, string>,
  fallback: string,
) => labels[normalizedLabelKey(value)] ?? fallback;

const lowerKeyed = (labels: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(labels).map(([key, value]) => [normalizedLabelKey(key), value]),
  );

const bestForArabic = lowerKeyed(arabicBestForLabel);
const districtArabic = lowerKeyed(arabicDistrictLabel);
const liveMapQueryArabic = lowerKeyed(arabicLiveMapQueryLabel);

const formatDisplayCount = (value: number, locale: PageLocale) =>
  locale === "ar" ? arabicNumberFormatter.format(value) : String(value);

export async function generateNeighborhoodMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, area } = await params;
  const city = await getCityBySlug(citySlug);
  const neighborhood = city ? getNeighborhood(city, area) : undefined;
  if (!city || !neighborhood) return {};

  const localizedHighlight =
    locale === "ar"
      ? getNeighbourhoodHighlights(city, "/ar", "ar").find(
          (highlight) => highlight.slug === neighborhood.slug,
        )
      : undefined;
  const cityName = localizedCityName(city, locale);
  const neighborhoodName = localizedHighlight?.name ?? neighborhood.name;
  const description =
    localizedHighlight?.description ?? neighborhood.operatingGuide;

  return pageMetadata({
    title:
      locale === "ar"
        ? `دليل منطقة ${neighborhoodName} في ${cityName}`
        : `${neighborhoodName} ${cityName} Neighborhood Guide`,
    description,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/neighborhood/${neighborhood.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateNeighborhoodMetadata(props);
}

export async function NeighborhoodPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, area } = await params;
  const city = await getCityBySlug(citySlug);
  const neighborhood = city ? getNeighborhood(city, area) : undefined;
  if (!city || !neighborhood) notFound();

  const siteSettings = await getSiteSettings();
  const guideCardSortMode = siteSettings.guideCardSortMode;
  const isArabic = locale === "ar";
  const localePrefix = isArabic ? "/ar" : "/en";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = `${localePrefix}/city/${city.slug}`;
  const listings = getListingsByNeighborhood(city, neighborhood.slug);
  const localizedHighlight = getNeighbourhoodHighlights(
    city,
    localePrefix,
    locale,
  ).find((highlight) => highlight.slug === neighborhood.slug);
  const neighborhoodName = localizedHighlight?.name ?? neighborhood.name;
  const neighborhoodDescription =
    localizedHighlight?.description ?? neighborhood.operatingGuide;
  const heroImage = getCityHeroImage(city);
  const neighborhoodItems = getGuideItems(city).filter((item) =>
    itemMatchesNeighborhood(item, neighborhood),
  );
  const itemGroups = guideKindOrder
    .map((kind) => {
      const items = sortGuideItemsForCards(
        neighborhoodItems.filter((item) => item.kind === kind),
        guideCardSortMode,
      ).map((item) => localizeGuideItem(item, locale));
      return { kind, items };
    })
    .filter((group) => group.items.length > 0);

  const labels = isArabic
    ? {
        areaGuide: "دليل المنطقة",
        backToCity: `عودة إلى دليل ${cityName}`,
        bestFor: "مناسب لـ",
        city: "المدينة",
        cluster: "النطاق",
        discover: "اكتشف",
        district: "الحي الإداري",
        exploreArea: `استكشف ${neighborhoodName}`,
        liveLocators: "محددات الخرائط المباشرة",
        map: "الخريطة",
        mappedListings: "أماكن محددة على الخريطة",
        neighborhoodContents: "محتوى هذه المنطقة",
        noGuideItems: "لم تتم إضافة عناصر دليل مرتبطة بهذه المنطقة بعد.",
        noListings: "لم تتم إضافة أماكن محددة لهذه المنطقة بعد.",
        openAreaMap: "افتح خريطة المنطقة",
        openMap: "الخريطة",
        planningNote:
          "ابدأ هنا لفهم المنطقة، ثم افتح الأماكن القريبة أو محددات الخرائط المباشرة حسب احتياجك.",
        sectionIntro:
          "كل ما يرتبط بهذه المنطقة من أقسام دليل المدينة، مرتّب حسب النوع ليسهل التخطيط.",
        savePrefix: "حفظ",
        totalGuideItems: "عناصر الدليل",
        totalListings: "أماكن الخريطة",
        verified: "تم التحقق",
        viewDetails: "عرض التفاصيل",
      }
    : {
        areaGuide: "Area guide",
        backToCity: `Back to ${cityName} guide`,
        bestFor: "Best for",
        city: "City",
        cluster: "Cluster",
        discover: "Discover",
        district: "District",
        exploreArea: `Explore ${neighborhoodName}`,
        liveLocators: "Live map locators",
        map: "Map",
        mappedListings: "Mapped places",
        neighborhoodContents: "In this neighborhood",
        noGuideItems:
          "No guide items have been connected to this neighborhood yet.",
        noListings: "No mapped places have been added for this area yet.",
        openAreaMap: "Open area map",
        openMap: "Map",
        planningNote:
          "Start here to understand the area, then open nearby places or live map locators based on what you need.",
        sectionIntro:
          "Everything in the city guide connected to this area, grouped by category for easier planning.",
        savePrefix: "Save",
        totalGuideItems: "Guide items",
        totalListings: "Mapped places",
        verified: "Verified",
        viewDetails: "View details",
      };
  const localizedBestFor = isArabic
    ? neighborhood.bestFor.map((item) =>
        localizedMappedLabel(
          item,
          bestForArabic,
          "تصنيف هذه المنطقة غير مكتمل في نظام إدارة المحتوى.",
        ),
      )
    : neighborhood.bestFor;
  const displayDistrict = isArabic
    ? localizedMappedLabel(
        neighborhood.district,
        districtArabic,
        "الحي الإداري غير مكتمل في نظام إدارة المحتوى.",
      )
    : neighborhood.district;
  const displayCluster = isArabic
    ? [
        arabicZoneLabel[neighborhood.zone] ?? neighborhood.zone,
        arabicClusterLabel[neighborhood.clusterType] ?? neighborhood.clusterType,
      ].join(" · ")
    : `${neighborhood.zone} · ${neighborhood.clusterType}`;
  const displayLiveMapQueries = neighborhood.liveMapQueries.map((query) => ({
    ...query,
    label: isArabic
      ? localizedMappedLabel(
          query.label,
          liveMapQueryArabic,
          "محدد خريطة مباشر",
        )
      : query.label,
  }));

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        { label: neighborhoodName },
      ]}
      locale={locale}
    >
      <JsonLd
        data={[
          neighborhoodJsonLd(city, neighborhood, locale),
          breadcrumbJsonLd(
            [
              { name: isArabic ? "الرئيسية" : "Home", path: "/" },
              { name: cityName, path: cityBasePath },
              {
                name: neighborhoodName,
                path: `${cityBasePath}/neighborhood/${neighborhood.slug}`,
              },
            ],
            locale,
          ),
        ]}
      />
      <main className="bg-white" dir={isArabic ? "rtl" : "ltr"}>
        <section className="border-b border-ink/10 bg-paper">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)] lg:items-center lg:py-14">
            <div>
              <Badge variant="red">{labels.areaGuide}</Badge>
              <h1 className="mt-4 text-5xl font-black leading-none tracking-tight text-ink md:text-6xl">
                {neighborhoodName}
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-ink/68">
                {neighborhoodDescription}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  asChild
                  className="bg-irhal-red text-white hover:bg-ink"
                >
                  <a href={neighborhood.mapUrl}>
                    <MapPin aria-hidden="true" />
                    {labels.openAreaMap}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link href={cityBasePath}>
                    {labels.backToCity}
                    <ArrowRight aria-hidden="true" className="rtl:rotate-180" />
                  </Link>
                </Button>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  [labels.city, cityName],
                  [labels.district, displayDistrict],
                  [labels.cluster, displayCluster],
                ].map(([label, value]) => (
                  <div
                    className="border-s-2 border-coastal bg-paper-deep px-4 py-3"
                    key={label}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-ink/55">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-black text-ink">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[330px] overflow-hidden rounded-lg bg-ink shadow-[0_24px_70px_rgba(23,33,29,0.18)] lg:min-h-[420px]">
              <Image
                alt=""
                className="object-cover"
                fill
                preload
                quality={90}
                sizes="(min-width: 1024px) 900px, 100vw"
                src={heroImage}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-irhal-yellow">
                  {labels.exploreArea}
                </p>
                <p className="mt-2 max-w-xl text-base font-bold leading-7 text-white/90">
                  {labels.planningNote}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-14">
          <div className="min-w-0">
            {localizedBestFor.length > 0 ? (
              <Card className="border-ink/10 shadow-none">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      aria-hidden="true"
                      className="h-5 w-5 text-irhal-red"
                    />
                    <h2 className="text-xl font-black text-ink">
                      {labels.bestFor}
                    </h2>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {localizedBestFor.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <section className="mt-10">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                    {labels.neighborhoodContents}
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
                    {neighborhoodName}
                  </h2>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-ink/65">
                  {labels.sectionIntro}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <a
                  className="rounded-lg border border-ink/10 bg-paper-deep p-4 transition hover:border-irhal-red/35 hover:bg-white hover:shadow-sm"
                  href="#mapped-listings"
                >
                  <p className="text-3xl font-black text-ink">
                    {formatDisplayCount(listings.length, locale)}
                  </p>
                  <p className="mt-1 text-sm font-black text-ink/65">
                    {labels.totalListings}
                  </p>
                </a>
                {itemGroups.map((group) => (
                  <a
                    className="rounded-lg border border-ink/10 bg-paper-deep p-4 transition hover:border-irhal-red/35 hover:bg-white hover:shadow-sm"
                    href={`#${sectionIdForKind(group.kind)}`}
                    key={group.kind}
                  >
                    <p className="text-3xl font-black text-ink">
                      {formatDisplayCount(group.items.length, locale)}
                    </p>
                    <p className="mt-1 text-sm font-black text-ink/65">
                      {kindPlural[group.kind][locale]}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            <section className="mt-12" id="mapped-listings">
              <h2 className="text-3xl font-black tracking-tight text-ink md:text-4xl">
                {labels.mappedListings}
              </h2>
              {listings.length > 0 ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {listings.map((listing) => {
                    const href = `${localePrefix}${pathForListing(city, listing)}`;

                    return (
                      <Card
                        className="overflow-hidden border-ink/10 shadow-none transition hover:border-irhal-red/30 hover:shadow-xl"
                        key={listing.slug}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <Badge variant="secondary">
                              {isArabic
                                ? arabicListingTypeLabel[
                                    listing.listingType
                                  ] ?? listing.listingType
                                : listing.listingType}
                            </Badge>
                            <a
                              aria-label={`${labels.openMap}: ${listing.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink/65 transition hover:border-irhal-red hover:text-irhal-red"
                              href={listing.mapUrl}
                            >
                              <Navigation
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            </a>
                          </div>
                          <h3 className="mt-4 text-xl font-black leading-tight text-travel-navy">
                            <Link className="hover:underline" href={href}>
                              {listing.name}
                            </Link>
                          </h3>
                          <p className="mt-3 text-sm leading-6 text-ink/65">
                            {listing.shortDescription}
                          </p>
                          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/55">
                              <MapPin aria-hidden="true" className="h-4 w-4" />
                              {neighborhoodName}
                            </span>
                            <DiscoverLink
                              className="ms-auto"
                              href={href}
                              label={isArabic ? "اكتشف" : "Discover"}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="mt-6 border-ink/10 bg-paper-deep shadow-none">
                  <CardContent className="p-6 text-sm font-bold text-ink/60">
                    {labels.noListings}
                  </CardContent>
                </Card>
              )}
            </section>

            {itemGroups.length > 0 ? (
              <div className="mt-12 space-y-14">
                {itemGroups.map((group) => (
                  <section id={sectionIdForKind(group.kind)} key={group.kind}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                          {formatDisplayCount(group.items.length, locale)}{" "}
                          {kindPlural[group.kind][locale]}
                        </p>
                        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
                          {kindPlural[group.kind][locale]} · {neighborhoodName}
                        </h2>
                      </div>
                    </div>
                    <div className="mt-7">
                      <GuideItemGrid
                        city={city}
                        cityName={cityName}
                        items={group.items}
                        labels={{
                          discover: labels.discover,
                          map: labels.map,
                          savePrefix: labels.savePrefix,
                          verified: labels.verified,
                        }}
                        locale={locale}
                        pathPrefix={localePrefix}
                        preserveOrder
                        sortMode={guideCardSortMode}
                      />
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <Card className="mt-12 border-ink/10 bg-paper-deep shadow-none">
                <CardContent className="p-6 text-sm font-bold text-ink/60">
                  {labels.noGuideItems}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-ink/10 shadow-none">
              <CardContent className="p-0">
                <MapPanel
                  layerLabel={
                    isArabic ? "طبقة خريطة إرحال" : "Irhal map layer"
                  }
                  markers={[
                    {
                      label: neighborhoodName,
                      latitude: neighborhood.latitude,
                      longitude: neighborhood.longitude,
                    },
                    ...listings.map((listing) => ({
                      label: listing.name,
                      latitude: listing.latitude,
                      longitude: listing.longitude,
                      tone:
                        listing.listingType === "masjid"
                          ? ("gold" as const)
                          : ("green" as const),
                    })),
                  ]}
                />
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  {labels.neighborhoodContents}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <a
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-black text-ink/72 transition hover:bg-paper-deep hover:text-irhal-red"
                    href="#mapped-listings"
                  >
                    {labels.mappedListings}
                    <span>{formatDisplayCount(listings.length, locale)}</span>
                  </a>
                  {itemGroups.map((group) => (
                    <a
                      className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-black text-ink/72 transition hover:bg-paper-deep hover:text-irhal-red"
                      href={`#${sectionIdForKind(group.kind)}`}
                      key={group.kind}
                    >
                      {kindPlural[group.kind][locale]}
                      <span>
                        {formatDisplayCount(group.items.length, locale)}
                      </span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-ink/10 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">{labels.liveLocators}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {displayLiveMapQueries.map((query) => (
                    <a
                      className="flex items-center justify-between gap-3 rounded-md border border-ink/10 p-3 text-sm font-bold text-ink/75 transition hover:border-irhal-red/40 hover:text-irhal-red"
                      href={query.providerUrl}
                      key={query.query}
                    >
                      {query.label}
                      <ExternalLink aria-hidden="true" className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-ink text-white shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-yellow">
                  {labels.areaGuide}
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {neighborhoodName}
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/72">
                  {labels.planningNote}
                </p>
                <Button
                  asChild
                  className="mt-5 w-full bg-white text-ink hover:bg-irhal-yellow"
                >
                  <a href={neighborhood.mapUrl}>
                    <MapPin aria-hidden="true" />
                    {labels.openAreaMap}
                  </a>
                </Button>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

export default async function NeighborhoodPage(props: Props) {
  return <NeighborhoodPageContent {...props} />;
}
