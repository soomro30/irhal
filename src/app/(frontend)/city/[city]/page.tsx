import {
  BusFront,
  CalendarDays,
  CarFront,
  DollarSign,
  ExternalLink,
  FerrisWheel,
  Globe2,
  Heart,
  History,
  Hotel,
  Baby,
  Languages,
  MapPin,
  MoonStar,
  Route,
  ShieldCheck,
  ShoppingBag,
  Thermometer,
  TreePalm,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { CityHeroCarousel } from "@/components/city-hero-carousel";
import { DiscoverLink } from "@/components/discover-action";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GuideItemRail } from "@/components/guide-item-card";
import { GuideSectionGrid } from "@/components/guide-section-grid";
import { NeighborhoodCarousel } from "@/components/neighborhood-carousel";
import { PracticalCityInfo } from "@/components/practical-city-info";
import {
  getCityHeroImages,
  getGuideItemImage,
  getNeighbourhoodHighlights,
} from "@/lib/city-presentation";
import { getCityBySlug } from "@/lib/city-source";
import {
  getGuideArticlesForSection,
  getGuideItemsByKind,
  localizeGuideItem,
  pathForGuideItem,
  type GuideItem,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, cityJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

type PageLocale = "en" | "ar";

type CityCategory = {
  title: string;
  href: string;
  icon?: LucideIcon;
  iconGroup?: "city-info" | "transport" | "halal" | "masjid";
  tone: string;
  count?: number;
  countLabel?: string;
  external?: boolean;
};

const primaryRailLimit = 8;
const secondaryRailLimit = 6;
const neighbourhoodPreviewLimit = 24;

const seededNumber = (value: string) =>
  [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  );

const dailyFamousSpots = (items: GuideItem[], citySlug: string) => {
  const daySeed = new Date().toISOString().slice(0, 10);

  return [...items]
    .map((item) => ({
      item,
      sort: seededNumber(`${citySlug}-${daySeed}-${item.slug}`),
    }))
    .sort((left, right) => left.sort - right.sort)
    .slice(0, 6)
    .map(({ item }) => item);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  return pageMetadata({
    title: city.seo.title,
    description: city.seo.description,
    path: `/city/${city.slug}`,
  });
}

export async function CityPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const isArabic = locale === "ar";
  const localePrefix = isArabic ? "/ar" : "/en";
  const cityTranslation = city.translations?.[locale] ?? {};
  const dir = isArabic ? "rtl" : "ltr";
  const cityBasePath = `${localePrefix}/city/${city.slug}`;
  const displayCityName =
    (typeof cityTranslation.name === "string" && cityTranslation.name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const displayCountry =
    (typeof cityTranslation.countryName === "string" &&
      cityTranslation.countryName) ||
    (isArabic && city.country === "Pakistan" ? "باكستان" : city.country);
  const displayLede =
    (typeof cityTranslation.lede === "string" && cityTranslation.lede) ||
    (isArabic && city.slug === "karachi"
      ? "كراتشي أكبر مدينة ساحلية في باكستان، ومركز أعمال نابض، ووجهة غنية بالمطاعم، وبوابة حضرية تجمع الأحياء التاريخية، والمناطق الساحلية، والأسواق، والمساجد، والمعالم المناسبة للعائلة."
      : city.lede);
  const currencyLabel =
    isArabic && city.currency === "PKR"
      ? "روبية باكستانية"
      : city.currency === "PKR"
        ? "Rupee"
        : city.currency;
  const languageLabel = isArabic
    ? city.slug === "karachi"
      ? "الأردية، الإنجليزية"
      : city.languages.slice(0, 2).join("، ")
    : city.languages.slice(0, 2).join(", ");
  const bestTimeLabel = isArabic
    ? city.slug === "karachi"
      ? "نوفمبر إلى فبراير"
      : "راجع دليل الطقس"
    : city.slug === "karachi"
      ? "November to February"
      : "Check weather guide";
  const heroFacts = [
    {
      label: isArabic ? "العملة" : "Currency",
      value: currencyLabel,
      icon: DollarSign,
    },
    {
      label: isArabic ? "اللغة" : "Language",
      value: languageLabel,
      icon: Languages,
    },
    {
      label: isArabic ? "أفضل وقت للزيارة" : "Best time to visit",
      value: bestTimeLabel,
      icon: CalendarDays,
    },
  ];
  const guideItemLabels = isArabic
    ? { discover: "اكتشف", map: "الخريطة", savePrefix: "حفظ", verified: "تم التحقق" }
    : { discover: "Discover", map: "Map", savePrefix: "Save", verified: "Verified" };
  const actionLabels = {
    all: isArabic ? "عرض الكل" : "Explore all",
    details: isArabic ? "اكتشف" : "Discover",
    famousBadge: isArabic ? "معلم مشهور" : "Famous spot",
    readMore: isArabic ? "اقرأ المزيد" : "Read more",
    shuffled: isArabic ? "يتغيّر يوميًا" : "Daily shuffled",
  };
  const jsonLd = [
    cityJsonLd(city, locale),
    breadcrumbJsonLd(
      [
        { name: "Home", path: "/" },
        { name: displayCityName, path: cityBasePath },
      ],
      locale,
    ),
  ];
  const places = getGuideItemsByKind(city, "place");
  const restaurants = getGuideItemsByKind(city, "restaurant");
  const hotels = getGuideItemsByKind(city, "hotel");
  const masjids = getGuideItemsByKind(city, "masjid");
  const festivals = getGuideItemsByKind(city, "festival");
  const shopping = getGuideItemsByKind(city, "shopping");
  const tours = getGuideItemsByKind(city, "tour");
  const familySpots = getGuideItemsByKind(city, "family");
  const displayPlaces = places.map((item) => localizeGuideItem(item, locale));
  const displayRestaurants = restaurants.map((item) =>
    localizeGuideItem(item, locale),
  );
  const displayHotels = hotels.map((item) => localizeGuideItem(item, locale));
  const displayMasjids = masjids.map((item) => localizeGuideItem(item, locale));
  const displayFestivals = festivals.map((item) =>
    localizeGuideItem(item, locale),
  );
  const displayFamilySpots = familySpots.map((item) =>
    localizeGuideItem(item, locale),
  );
  const displayShopping = shopping.map((item) => localizeGuideItem(item, locale));
  const displayTours = tours.map((item) => localizeGuideItem(item, locale));
  const articleCountForSection = (sectionSlug: string) =>
    getGuideArticlesForSection(city, sectionSlug).length;
  const heroImages = getCityHeroImages(city);
  const cityCategories: CityCategory[] = [
    {
      title: isArabic ? "أماكن تستحق الزيارة" : "places to visit",
      href: `${cityBasePath}/section/places-to-visit`,
      icon: TreePalm,
      tone: "bg-[#ff6b00]",
      count: places.length,
    },
    {
      title: isArabic ? "التاريخ" : "history",
      href: `${cityBasePath}/section/city-information`,
      icon: History,
      tone: "bg-[#f5a800]",
      count: articleCountForSection("city-information"),
    },
    {
      title: isArabic ? "بالقرب منك" : "nearby",
      href: city.mapUrl,
      icon: MapPin,
      tone: "bg-[#ffdd00]",
      external: true,
      countLabel: isArabic ? "مباشر" : "live",
    },
    {
      title: isArabic ? "الفنادق" : "hotels",
      href: `${cityBasePath}/section/hotels`,
      icon: Hotel,
      tone: "bg-[#b8174f]",
      count: hotels.length,
    },
    {
      title: isArabic ? "المطاعم" : "restaurants",
      href: `${cityBasePath}/section/food-and-restaurants`,
      icon: Utensils,
      tone: "bg-irhal-magenta",
      count: restaurants.length,
    },
    {
      title: isArabic ? "التسوق" : "shopping",
      href: `${cityBasePath}/section/shopping`,
      icon: ShoppingBag,
      tone: "bg-[#ed5b96]",
      count: shopping.length,
    },
    {
      title: isArabic ? "معلومات المدينة" : "city info.",
      href: `${cityBasePath}/section/visitor-information`,
      iconGroup: "city-info",
      tone: "bg-[#204a91]",
      count: articleCountForSection("visitor-information"),
    },
    {
      title: isArabic ? "المواصلات" : "transport",
      href: `${cityBasePath}/section/transportation-and-getting-around`,
      iconGroup: "transport",
      tone: "bg-[#0874c9]",
      count: articleCountForSection("transportation-and-getting-around"),
    },
    {
      title: isArabic ? "الفعاليات" : "festivals",
      href: `${cityBasePath}/section/festivals-and-annual-events`,
      icon: FerrisWheel,
      tone: "bg-[#25a9dd]",
      count: festivals.length,
    },
    {
      title: isArabic ? "مع الأطفال" : "with kids",
      href: `${cityBasePath}/section/children-in-tow`,
      icon: Baby,
      tone: "bg-[#00a3a3]",
      count: familySpots.length,
    },
    {
      title: isArabic ? "المساجد" : "masjids",
      href: `${cityBasePath}/section/muslim-visitor-information`,
      iconGroup: "masjid",
      tone: "bg-[#00783c]",
      count: masjids.length,
    },
    {
      title: isArabic ? "مطاعم حلال" : "halal restaurants",
      href: `${cityBasePath}/islamic-travel`,
      iconGroup: "halal",
      tone: "bg-[#35aa32]",
      count:
        restaurants.filter((item) =>
          /halal/i.test(`${item.title} ${item.description} ${item.category}`),
        ).length || restaurants.length,
    },
    {
      title: isArabic ? "مواقيت الصلاة" : "prayer times",
      href: `${cityBasePath}/prayer-times`,
      icon: MoonStar,
      tone: "bg-[#95c915]",
      countLabel: isArabic ? "اليوم" : "today",
    },
  ];
  const neighbourhoodCards = getNeighbourhoodHighlights(
    city,
    localePrefix,
    locale,
  ).slice(0, neighbourhoodPreviewLimit);
  const famousSpots = dailyFamousSpots(displayPlaces, city.slug);

  return (
    <PageShell
      breadcrumbs={[
        { label: isArabic ? "الرئيسية" : "Home", href: isArabic ? "/ar" : "/" },
        { label: displayCityName },
      ]}
      locale={locale}
    >
      <JsonLd data={jsonLd} />
      <main className={isArabic ? "font-arabic" : undefined} dir={dir}>
        <section className="relative min-h-[520px] overflow-hidden bg-ink text-white md:min-h-[390px]">
          <CityHeroCarousel
            alt={`${displayCityName} travel banner`}
            dir={dir}
            images={heroImages}
            labels={{
              next: isArabic ? "عرض الصورة التالية" : "Show next banner image",
              previous: isArabic
                ? "عرض الصورة السابقة"
                : "Show previous banner image",
              slide: isArabic ? "صورة البانر" : "Banner image",
            }}
          />
          <div className="absolute inset-0 bg-ink/10 md:hidden" />
          <div className="absolute inset-y-0 left-0 hidden w-[43%] rounded-r-[999px] bg-[#3a3a3a] md:block rtl:left-auto rtl:right-0 rtl:rounded-l-[999px] rtl:rounded-r-none" />
          <div className="relative mx-auto flex min-h-[520px] max-w-7xl items-end px-5 py-8 md:min-h-[390px] md:items-center">
            <div className="w-full rounded-lg bg-ink/78 p-5 backdrop-blur-sm md:w-[32%] md:max-w-[390px] md:rounded-none md:bg-transparent md:p-0 md:backdrop-blur-0">
              <p className="text-sm font-black text-white">{displayCountry}</p>
              <h1 className="mt-3 text-6xl font-black leading-none tracking-tight md:text-7xl">
                {displayCityName}
              </h1>
              <p className="mt-5 max-w-sm text-base leading-7 text-white/90">
                {displayLede}
              </p>
              <div className="mt-7 grid grid-cols-1 gap-4 border-t border-white/20 pt-5 sm:grid-cols-3 md:max-w-[520px]">
                {heroFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div key={fact.label}>
                      <p className="text-[11px] font-black uppercase tracking-wide text-white/85">
                        {fact.label}
                      </p>
                      <p className="mt-2 flex items-start gap-2 text-sm font-bold italic leading-5 text-white">
                        <Icon
                          aria-hidden="true"
                          className="mt-0.5 h-4 w-4 shrink-0 text-white/85"
                        />
                        <span>{fact.value}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="sm" variant="quiet">
                  <Link href={`${cityBasePath}/itineraries`}>
                    <Route aria-hidden="true" />
                    {isArabic ? "خطط رحلتك" : "Plan"}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="quiet">
                  <a href={city.mapUrl}>
                    <MapPin aria-hidden="true" />
                    {isArabic ? "الخريطة" : "Map"}
                    <ExternalLink aria-hidden="true" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-white py-8">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-irhal-red">
                  {isArabic ? "دليل المدينة" : "City guide"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
                  {isArabic ? `استكشف ${displayCityName}` : `Explore ${city.name}`}
                </h2>
              </div>
              <p className="max-w-2xl text-sm leading-6 text-ink/65">
                {isArabic
                  ? "ابدأ من هنا للوصول بسرعة إلى المعالم، والمطاعم، والفنادق، والتسوق، والمواصلات، ونصائح السفر الإسلامي في المدينة."
                  : "Start here for the city’s sights, food, hotels, shopping, transport, maps, and Muslim-friendly travel essentials."}
              </p>
            </div>
            <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
              {cityCategories.map((card) => {
                const Icon = card.icon;
                const cardClassName = `group flex h-28 w-28 shrink-0 flex-col items-center justify-center border-0 p-3 text-center font-sans text-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(0,0,0,0.16)] ${card.tone}`;
                const content = (
                  <>
                    {card.iconGroup === "city-info" ? (
                      <span
                        aria-hidden="true"
                        className="grid h-10 w-14 grid-cols-3 place-items-center"
                      >
                        <DollarSign className="h-8 w-6 stroke-[1.8]" />
                        <Thermometer className="h-9 w-6 stroke-[1.8]" />
                        <Globe2 className="h-8 w-7 stroke-[1.8]" />
                      </span>
                    ) : card.iconGroup === "transport" ? (
                      <span
                        aria-hidden="true"
                        className="flex h-10 items-end justify-center gap-1"
                      >
                        <CarFront className="h-7 w-7 fill-white stroke-[1.45]" />
                        <BusFront className="h-10 w-9 fill-white stroke-[1.45]" />
                      </span>
                    ) : card.iconGroup === "halal" ? (
                      <span
                        aria-hidden="true"
                        className="flex h-10 items-center justify-center text-[34px] font-black leading-none"
                        lang="ar"
                      >
                        حلال
                      </span>
                    ) : card.iconGroup === "masjid" ? (
                      <span
                        aria-hidden="true"
                        className="relative flex h-10 w-14 items-end justify-center"
                      >
                        <span className="absolute bottom-0 left-1.5 h-8 w-2 rounded-t-full bg-white" />
                        <span className="absolute bottom-8 left-[11px] h-1.5 w-1.5 rounded-full bg-white" />
                        <span className="absolute bottom-[37px] left-[13px] h-2 w-px bg-white" />
                        <span className="absolute bottom-0 left-[22px] h-7 w-8 rounded-t-full bg-white" />
                        <span className="absolute bottom-0 left-[19px] h-3 w-[38px] rounded-t-sm bg-white" />
                        <span className="absolute bottom-8 left-10 h-1.5 w-1.5 rounded-full bg-white" />
                      </span>
                    ) : Icon ? (
                      <Icon
                        aria-hidden="true"
                        className="h-10 w-10 stroke-[1.65]"
                        strokeWidth={1.65}
                      />
                    ) : null}
                    <span className="mt-1 text-[16px] font-normal lowercase leading-[1.08] tracking-normal">
                      {card.title}
                    </span>
                    <Badge className="mt-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-bold leading-none text-white shadow-sm">
                      {card.countLabel ?? card.count}
                    </Badge>
                  </>
                );

                if (card.external) {
                  return (
                    <a className="block shrink-0" href={card.href} key={card.title}>
                      <Card className={cardClassName}>{content}</Card>
                    </a>
                  );
                }

                return (
                  <Link
                    className="block shrink-0"
                    href={card.href}
                    key={card.title}
                  >
                    <Card className={cardClassName}>{content}</Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/places-to-visit`}
          items={displayPlaces.slice(0, primaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? `اكتشف ${places.length} معلمًا وتجربة، من المتاحف والشواطئ والمزارات إلى الحدائق ومحطات التراث في أنحاء المدينة.`
              : `Discover ${places.length} sights and experiences, from museums, beaches, and shrines to parks and heritage stops across the city.`
          }
          title={
            isArabic
              ? `أفضل الأماكن للزيارة في ${displayCityName}`
              : `Top places to visit in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.readMore}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/food-and-restaurants`}
          items={displayRestaurants.slice(0, primaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? `مشهد الطعام في كراتشي جزء أساسي من تجربة المدينة. اختر من ${restaurants.length} مطعمًا ومنطقة طعام مع ملاحظات عن الموقع والأطباق المناسبة للتخطيط.`
              : `Karachi’s food scene is part of the city experience. Choose from ${restaurants.length} restaurants and food districts with location notes and planning tips.`
          }
          title={
            isArabic
              ? `المطاعم وتجارب الطعام في ${displayCityName}`
              : `Food and restaurants in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/children-in-tow`}
          items={displayFamilySpots.slice(0, primaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? "أماكن وأنشطة تناسب العائلات، مع ملاحظات تساعدك على تخطيط اليوم حول الحرارة والتنقل وراحة الأطفال."
              : "Family-friendly places and activities, with notes to help plan around heat, traffic, and easier days with children."
          }
          title={
            isArabic
              ? `السفر مع الأطفال في ${displayCityName}`
              : `Traveling with kids in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/hotels`}
          items={displayHotels.slice(0, secondaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? "اختر منطقة الإقامة حسب أسلوب رحلتك، من الأعمال والعائلات إلى الإقامة قرب المطار أو المدينة القديمة أو كليفتون ودي إتش إيه."
              : "Choose where to stay by trip style, from business and family bases to airport, old-city, Clifton, and DHA stays."
          }
          title={
            isArabic
              ? `أفضل مناطق الإقامة في ${displayCityName}`
              : `Where to stay in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/shopping`}
          items={displayShopping.slice(0, primaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? `تعرّف إلى ${shopping.length} وجهة تسوق، من المراكز التجارية والأسواق وأسواق الكتب إلى شوارع الأزياء ومحلات الهدايا.`
              : `Explore ${shopping.length} shopping stops, from malls, markets, and book bazaars to fashion streets and souvenir finds.`
          }
          title={
            isArabic ? `دليل التسوق في ${displayCityName}` : `Shopping in ${city.name}`
          }
        />

        <PracticalCityInfo city={city} locale={locale} />

        <NeighborhoodCarousel
          cityName={displayCityName}
          dir={dir}
          items={neighbourhoodCards}
          labels={{
            areas: isArabic ? "مناطق" : "areas",
            eyebrow: isArabic ? "دليل المناطق" : "Area guide",
            next: isArabic ? "عرض المناطق التالية" : "Next neighbourhoods",
            previous: isArabic
              ? "عرض المناطق السابقة"
              : "Previous neighbourhoods",
            title: isArabic ? "الأحياء والمناطق" : "Neighbourhoods",
          }}
        />

        <section className="border-t border-ink/10 bg-white py-14">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                  {isArabic ? "مختارات من المدينة" : "City highlights"}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
                  {isArabic ? "معالم بارزة في كراتشي" : `Signature sights in ${city.name}`}
                </h2>
              </div>
              <Badge
                className="rounded-full bg-coastal px-3 py-1 text-white"
                variant="coastal"
              >
                {actionLabels.shuffled}
              </Badge>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {famousSpots.map((place) => {
                const placePath = `${localePrefix}${pathForGuideItem(city, place)}`;

                return (
                  <Card
                    className="overflow-hidden rounded-lg border-ink/10 bg-white shadow-none"
                    key={place.id}
                  >
                    <div className="relative h-[174px] overflow-hidden bg-neutral-100">
                      <Link className="absolute inset-0" href={placePath}>
                        <Image
                          alt={place.imageAlt}
                          className="object-cover"
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          src={getGuideItemImage(place).image}
                          style={{
                            objectPosition:
                              getGuideItemImage(place).objectPosition,
                          }}
                        />
                      </Link>
                      <Badge className="absolute left-3 top-3 rounded-md bg-[#16325c] px-2.5 py-1 text-xs font-bold leading-none text-white shadow-sm rtl:left-auto rtl:right-3">
                        {actionLabels.famousBadge}
                      </Badge>
                      <Button
                        aria-label={`${guideItemLabels.savePrefix} ${place.title}`}
                        className="absolute right-3 top-3 h-9 w-9 rounded-full border-white bg-white/95 text-travel-navy shadow-sm hover:bg-white rtl:left-3 rtl:right-auto"
                        size="icon"
                        type="button"
                        variant="outline"
                      >
                        <Heart aria-hidden="true" className="h-5 w-5" />
                      </Button>
                    </div>
                    <CardContent className="flex min-h-[190px] flex-col p-4">
                      <p className="text-sm font-bold leading-5 text-travel-navy/65">
                        {displayCityName}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-6 text-travel-navy">
                        <Link className="hover:underline" href={placePath}>
                          {place.title}
                        </Link>
                      </h3>
                      {place.category && place.category !== place.title ? (
                        <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-coastal">
                          {place.category}
                        </p>
                      ) : null}
                      <p className="mt-1.5 line-clamp-4 text-sm leading-6 text-travel-navy/80">
                        {place.originalContent?.[0] ?? place.description}
                      </p>
                      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
                        <DiscoverLink href={placePath} label={actionLabels.details} />
                        {place.geoStatus === "verified" ? (
                          <div className="ms-auto inline-flex items-center gap-1.5 text-sm font-bold text-travel-navy">
                            <ShieldCheck
                              aria-hidden="true"
                              className="h-4 w-4 text-coastal"
                            />
                            {guideItemLabels.verified}
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/festivals-and-annual-events`}
          items={displayFestivals.slice(0, primaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? `خطط رحلتك وفق ${festivals.length} مواسم وفعاليات، بما في ذلك المناسبات العامة، وفترات رمضان والعيد، ومعارض الكتب، والأنشطة الفنية، ومواسم الطعام الشتوية.`
              : `Plan around ${festivals.length} festival seasons, public events, Ramadan/Eid periods, book fairs, art cycles, and winter food activity.`
          }
          title={
            isArabic
              ? `المهرجانات والفعاليات في ${displayCityName}`
              : `Festivals and events in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/organized-tours`}
          items={displayTours.slice(0, secondaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? "مسارات تراثية، وجولات طعام، ورحلات ساحلية، وزيارات متاحف، وبرامج عائلية، وتجارب قابلة للتخطيط."
              : "Heritage walks, food crawls, coastal trips, museum circuits, family days, and guided ideas for an easier day out."
          }
          title={
            isArabic
              ? `جولات وتجارب ${displayCityName}`
              : `${city.name} tours and experiences`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/muslim-visitor-information`}
          items={displayMasjids.slice(0, secondaryRailLimit)}
          labels={guideItemLabels}
          pathPrefix={localePrefix}
          subtitle={
            isArabic
              ? "مساجد بارزة ومحتوى مهيأ لاحتياجات الصلاة ضمن تجربة السفر الإسلامي، مع قابلية إضافة معلومات مرافق صلاة النساء."
              : "Landmark masjids and prayer-aware notes for visitors planning salah, family movement, and halal-friendly days."
          }
          title={
            isArabic
              ? `المساجد والسفر الإسلامي في ${displayCityName}`
              : `${city.name} masjids and Muslim travel`
          }
        />

        <GuideSectionGrid city={city} cityName={displayCityName} locale={locale} />
      </main>
    </PageShell>
  );
}

export default async function CityPage(props: Props) {
  return <CityPageContent {...props} />;
}
