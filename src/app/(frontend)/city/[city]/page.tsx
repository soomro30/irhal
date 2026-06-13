import {
  ArrowUpRight,
  CalendarDays,
  CloudSun,
  DollarSign,
  Languages,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { CityHeroCarousel } from "@/components/city-hero-carousel";
import {
  CityExploreRail,
  type CityExploreItem,
} from "@/components/city-explore-rail";
import { PageShell } from "@/components/page-shell";
import { FeatureRail } from "@/components/feature-rail";
import {
  GuideItemRail,
  sortGuideItemsForCards,
} from "@/components/guide-item-card";
import {
  ItineraryPlannerShowcase,
  type ItineraryShowcaseItem,
} from "@/components/itinerary-planner-showcase";
import {
  GuideSectionGrid,
  sectionImage,
} from "@/components/guide-section-grid";
import { NeighborhoodCarousel } from "@/components/neighborhood-carousel";
import { PracticalCityInfo } from "@/components/practical-city-info";
import { SiteSearchBox } from "@/components/site-search-box";
import {
  getCityHeroImages,
  getGuideItemImage,
  getNeighbourhoodHighlights,
} from "@/lib/city-presentation";
import { getCityBySlug } from "@/lib/city-source";
import { getCurrentWeatherForCity } from "@/lib/current-weather";
import { cn } from "@/lib/utils";
import {
  formatItineraryDuration,
  formatItineraryStopCount,
  itineraryCardImageMap,
  resolveItineraryStops,
  itineraryStopCount,
  localizeItinerary,
} from "@/lib/itineraries";
import {
  getGuideArticlesForSection,
  getGuideItemsByKind,
  getGuideItemsForSection,
  getLocalizedGuideSectionCopy,
  itineraryGuideSectionSlug,
  localizeGuideArticle,
  localizeGuideItem,
  pathForGuideItem,
  type GuideItem,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, cityJsonLd, pageMetadata } from "@/lib/seo";
import {
  getPrayerTimesForCity,
  type PrayerKey,
  type PrayerTime,
} from "@/lib/prayer-times";
import { getSiteSettings } from "@/lib/site-settings";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateStaticParams() {
  return [];
}

type PageLocale = "en" | "ar";

const primaryRailLimit = 8;
const secondaryRailLimit = 6;
const neighbourhoodPreviewLimit = 24;

const heroPrayerNames: Record<PageLocale, Record<PrayerKey, string>> = {
  ar: {
    Asr: "العصر",
    Dhuhr: "الظهر",
    Fajr: "الفجر",
    Isha: "العشاء",
    Maghrib: "المغرب",
    Sunrise: "الشروق",
  },
  en: {
    Asr: "Asr",
    Dhuhr: "Dhuhr",
    Fajr: "Fajr",
    Isha: "Isha",
    Maghrib: "Maghrib",
    Sunrise: "Sunrise",
  },
};

const formatPrayerClock = (time: string, locale: PageLocale) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date(Date.UTC(2026, 0, 1, Number(hour), Number(minute)));

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const localizePrayer = (prayer: PrayerTime, locale: PageLocale) => ({
  ...prayer,
  label: heroPrayerNames[locale][prayer.key],
  time: formatPrayerClock(prayer.time, locale),
});

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

  const siteSettings = await getSiteSettings();
  const guideCardSortMode = siteSettings.guideCardSortMode;
  const prayerTimes = await getPrayerTimesForCity(city).catch((error) => {
    console.error(`City prayer times failed for ${city.slug}.`, error);
    return undefined;
  });
  const currentWeather = await getCurrentWeatherForCity(city).catch((error) => {
    console.error(`City weather failed for ${city.slug}.`, error);
    return undefined;
  });
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
    (typeof cityTranslation.description === "string" &&
      cityTranslation.description) ||
    (isArabic && city.slug === "karachi"
      ? "كراتشي أكبر مدينة ساحلية في باكستان، ومركز أعمال نابض، ووجهة غنية بالمطاعم، وبوابة حضرية تجمع الأحياء التاريخية، والمناطق الساحلية، والأسواق، والمساجد، والمعالم المناسبة للعائلة."
      : city.lede);
  const currencyLabel =
    isArabic && typeof cityTranslation.currency === "string"
      ? cityTranslation.currency
      : isArabic && city.currency === "PKR"
        ? "روبية باكستانية"
        : isArabic && city.currency === "GBP"
          ? "الجنيه الإسترليني"
          : city.currency === "PKR"
            ? "Rupee"
            : city.currency;
  const languageLabel = isArabic
    ? typeof cityTranslation.languages === "string"
      ? cityTranslation.languages
      : city.slug === "karachi"
        ? "الأردية، الإنجليزية"
        : city.languages
            .slice(0, 2)
            .map((language) =>
              language === "English"
                ? "الإنجليزية"
                : language === "Arabic"
                  ? "العربية"
                  : language,
            )
            .join("، ")
    : city.languages.slice(0, 2).join(", ");
  const bestTimeLabel = isArabic
    ? typeof cityTranslation.bestTimeToVisit === "string"
      ? cityTranslation.bestTimeToVisit
      : city.slug === "karachi"
        ? "نوفمبر إلى فبراير"
        : "راجع دليل الطقس"
    : city.slug === "karachi"
      ? "November to February"
      : "Check weather guide";
  const nextPrayer = prayerTimes?.nextPrayer
    ? localizePrayer(prayerTimes.nextPrayer, locale)
    : undefined;
  const prayerCopy = isArabic
    ? {
        full: "عرض الجدول الكامل",
        next: "الصلاة القادمة",
      }
    : {
        full: "Full timetable",
        next: "Next prayer",
      };
  const weatherText = currentWeather
    ? isArabic
      ? `${currentWeather.temperature}${currentWeather.unit}`
      : `${currentWeather.temperature}${currentWeather.unit} ${currentWeather.label}`
    : undefined;
  const citySearchCopy = isArabic
    ? {
        placeholder: `ابحث في ${displayCityName} عن الفنادق والمطاعم الحلال والمساجد والأماكن`,
        search: "بحث",
      }
    : {
        placeholder: `Search ${displayCityName} hotels, halal restaurants, masjids, places...`,
        search: "Search",
      };
  const cityTodayHref = `${cityBasePath}/section/city-information/city-today`;
  const cityTodayLabel = isArabic
    ? "المزيد عن المدينة اليوم"
    : "More about the city today";
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
  const localizeSortedItems = (items: GuideItem[]) =>
    sortGuideItemsForCards(items, guideCardSortMode).map((item) =>
      localizeGuideItem(item, locale),
    );
  const displayPlaces = localizeSortedItems(places);
  const displayRestaurants = localizeSortedItems(restaurants);
  const displayHotels = localizeSortedItems(hotels);
  const displayMasjids = localizeSortedItems(masjids);
  const displayFestivals = localizeSortedItems(festivals);
  const displayFamilySpots = localizeSortedItems(familySpots);
  const displayShopping = localizeSortedItems(shopping);
  const displayTours = localizeSortedItems(tours);
  const displayItineraries = city.itineraries.map((itinerary) =>
    localizeItinerary(itinerary, locale),
  );
  const itineraryCardImages = itineraryCardImageMap({
    city,
    itineraries: city.itineraries,
    locale,
  });
  const articleCountForSection = (sectionSlug: string) =>
    getGuideArticlesForSection(city, sectionSlug).length;
  const contentCountForSection = (sectionSlug: string) =>
    getGuideItemsForSection(city, sectionSlug).length ||
    articleCountForSection(sectionSlug);
  const itinerarySectionCopy = getLocalizedGuideSectionCopy(
    city,
    itineraryGuideSectionSlug,
    locale,
  );
  const heroImages = getCityHeroImages(city);
  const cityCategories: CityExploreItem[] = [
    {
      title: itinerarySectionCopy.title,
      href: `${cityBasePath}/itineraries`,
      iconKey: "route",
      tone: "bg-[#cc2f2f]",
      count: city.itineraries.length,
    },
    {
      title: isArabic ? "أماكن تستحق الزيارة" : "places to visit",
      href: `${cityBasePath}/section/places-to-visit`,
      iconKey: "palm",
      tone: "bg-[#ff6b00]",
      count: places.length,
    },
    {
      title: isArabic ? "التاريخ" : "history",
      href: `${cityBasePath}/section/city-information`,
      iconKey: "history",
      tone: "bg-[#f5a800]",
      count: contentCountForSection("city-information"),
    },
    {
      title: isArabic ? "بالقرب منك" : "nearby",
      href: city.mapUrl,
      iconKey: "pin",
      tone: "bg-[#ffdd00]",
      external: true,
      countLabel: isArabic ? "مباشر" : "live",
    },
    {
      title: isArabic ? "الفنادق" : "hotels",
      href: `${cityBasePath}/section/hotels`,
      iconKey: "hotel",
      tone: "bg-[#b8174f]",
      count: hotels.length,
    },
    {
      title: isArabic ? "المطاعم" : "restaurants",
      href: `${cityBasePath}/section/food-and-restaurants`,
      iconKey: "utensils",
      tone: "bg-irhal-magenta",
      count: restaurants.length,
    },
    {
      title: isArabic ? "التسوق" : "shopping",
      href: `${cityBasePath}/section/shopping`,
      iconKey: "shopping",
      tone: "bg-[#ed5b96]",
      count: shopping.length,
    },
    {
      title: isArabic ? "معلومات المدينة" : "city info.",
      href: `${cityBasePath}/section/visitor-information`,
      iconKey: "city-info",
      tone: "bg-[#204a91]",
      count: contentCountForSection("visitor-information"),
    },
    {
      title: isArabic ? "المواصلات" : "transport",
      href: `${cityBasePath}/section/transportation-and-getting-around`,
      iconKey: "transport",
      tone: "bg-[#0874c9]",
      count: contentCountForSection("transportation-and-getting-around"),
    },
    {
      title: isArabic ? "الفعاليات" : "festivals",
      href: `${cityBasePath}/section/festivals-and-annual-events`,
      iconKey: "ferris",
      tone: "bg-[#25a9dd]",
      count: festivals.length,
    },
    {
      title: isArabic ? "مع الأطفال" : "with kids",
      href: `${cityBasePath}/section/children-in-tow`,
      iconKey: "baby",
      tone: "bg-[#00a3a3]",
      count: familySpots.length,
    },
    {
      title: isArabic ? "المساجد" : "masjids",
      href: `${cityBasePath}/section/muslim-visitor-information`,
      iconKey: "masjid",
      tone: "bg-[#00783c]",
      count: masjids.length,
    },
    {
      title: isArabic ? "مطاعم حلال" : "halal restaurants",
      href: `${cityBasePath}/section/food-and-restaurants`,
      iconKey: "halal",
      tone: "bg-[#35aa32]",
      count:
        restaurants.filter((item) =>
          /halal/i.test(`${item.title} ${item.description} ${item.category}`),
        ).length || restaurants.length,
    },
    {
      title: isArabic ? "مواقيت الصلاة" : "prayer times",
      href: `${cityBasePath}/prayer-times`,
      iconKey: "moon",
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
  const itineraryCopy = {
    action: isArabic ? "عرض كل المسارات" : "Explore all",
    badge: isArabic ? "جاهز للتخطيط" : "Ready to plan",
    featured: isArabic ? "مسار مختار" : "Featured route",
    map: isArabic ? "خريطة المسار" : "Route map",
    more: isArabic ? "مسارات أخرى" : "More route ideas",
    open: isArabic ? "فتح المسار" : "Open itinerary",
    preview: isArabic ? "معاينة المسار" : "Route preview",
    subtitle: itinerarySectionCopy.summary,
    title: isArabic
      ? `مسارات الرحلة في ${displayCityName}`
      : `${city.name} itineraries`,
  };
  const itineraryShowcaseItems: ItineraryShowcaseItem[] =
    displayItineraries.map((itinerary, index) => {
      const sourceItinerary = city.itineraries[index] ?? itinerary;
      const resolvedStops = resolveItineraryStops({
        city,
        itinerary: sourceItinerary,
        locale,
      }).flatMap((day) => day.stops);

      return {
        key: itinerary.slug,
        href: `${cityBasePath}/itineraries/${itinerary.slug}`,
        image: itineraryCardImages[itinerary.slug],
        imageAlt: itinerary.title,
        title: itinerary.title,
        summary: itinerary.summary,
        audience: itinerary.audience,
        durationLabel: formatItineraryDuration(itinerary.durationDays, locale),
        stopCountLabel: formatItineraryStopCount(
          itineraryStopCount(itinerary),
          locale,
        ),
        routeNote: itinerary.days[0]?.routeNotes,
        chips: itinerary.days
          .map((day) => day.theme)
          .filter((theme): theme is string => Boolean(theme))
          .slice(0, 3),
        stopLabels: resolvedStops.map((stop) => stop.title).slice(0, 4),
      };
    });
  const articleRailCards = (sectionSlug: string, limit = 8) => {
    const sectionCopy = getLocalizedGuideSectionCopy(city, sectionSlug, locale);

    return getGuideArticlesForSection(city, sectionSlug)
      .map((article) => localizeGuideArticle(article, locale))
      .slice(0, limit)
      .map((article, index) => ({
        key: `${sectionSlug}-${article.slug}`,
        href: `${cityBasePath}/section/${sectionSlug}/${article.slug}`,
        image: article.imageUrl || sectionImage(sectionSlug),
        imageAlt:
          article.imageAlt ?? `${article.title} guide for ${displayCityName}`,
        eyebrow: sectionCopy.title,
        title: article.title,
        description: article.summary,
        discoverLabel: actionLabels.details,
        eager: index < 2,
      }));
  };
  const visitorArticleCards = articleRailCards("visitor-information", 8);
  const transportArticleCards = articleRailCards(
    "transportation-and-getting-around",
    8,
  );
  const cityInfoArticleCards = articleRailCards("city-information", 8);

  return (
    <PageShell locale={locale}>
      <JsonLd data={jsonLd} />
      <main className={isArabic ? "font-arabic" : undefined} dir={dir}>
        <section className="border-b border-ink/10 bg-white">
          <div className="bg-[#F2F2F2]">
            <div
              className={cn(
                "mx-auto grid max-w-7xl gap-5 px-6 pb-5 pt-6 sm:px-8 lg:items-stretch lg:px-12 lg:pt-7",
                isArabic
                  ? "lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]"
                  : "lg:grid-cols-[minmax(340px,0.75fr)_minmax(0,1.55fr)]",
              )}
              dir="ltr"
            >
              <div
                className={cn(
                  "relative min-h-[240px] w-full overflow-hidden rounded-xl sm:min-h-[300px] lg:h-full lg:min-h-[360px] xl:min-h-[380px]",
                  isArabic ? "lg:order-1" : "lg:order-2",
                )}
              >
                <CityHeroCarousel
                  alt={`${displayCityName} travel banner`}
                  autoAdvanceMs={6000}
                  dir={dir}
                  frameClassName="absolute inset-0"
                  images={heroImages}
                  labels={{
                    next: isArabic
                      ? "عرض الصورة التالية"
                      : "Show next banner image",
                    previous: isArabic
                      ? "عرض الصورة السابقة"
                      : "Show previous banner image",
                    slide: isArabic ? "صورة البانر" : "Banner image",
                  }}
                  sizes="(min-width: 1440px) 1920px, (min-width: 1024px) 1600px, 100vw"
                />
              </div>
              <div
                className={cn(
                  "flex min-h-[320px] flex-col rounded-xl bg-[#81BEFF] p-5 text-ink lg:h-full lg:min-h-[360px] xl:min-h-[380px]",
                  isArabic ? "lg:order-2" : "lg:order-1",
                )}
                dir={dir}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-ink">
                    {displayCountry}
                  </p>
                  <div className="flex flex-col items-start gap-1.5 ltr:items-end">
                    {weatherText ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00EB5B] px-2.5 py-1 text-xs font-black text-ink ring-1 ring-white/15">
                        <CloudSun aria-hidden="true" className="h-3.5 w-3.5" />
                        {weatherText}
                      </span>
                    ) : null}
                    {nextPrayer ? (
                      <Link
                        aria-label={`${prayerCopy.full}: ${nextPrayer.label} ${nextPrayer.time}`}
                        className="group inline-flex max-w-full items-center gap-2 rounded-full border border-ink/15 bg-white/90 px-2 py-1.5 text-xs font-black text-ink shadow-sm backdrop-blur-sm transition hover:bg-white hover:border-ink/35"
                        href={`${cityBasePath}/prayer-times`}
                      >
                        <span className="block h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#00EB5B] ring-1 ring-white/60">
                          <Image
                            alt=""
                            aria-hidden="true"
                            className="h-full w-full object-contain"
                            height={28}
                            src="/icons/portal-mosque-icon-tight.png"
                            width={28}
                          />
                        </span>
                        <span className="min-w-0 whitespace-nowrap">
                          <span className="text-ink/65">{prayerCopy.next}:</span>
                          <span> </span>
                          <span className="px-1 text-ink">{nextPrayer.label}</span>
                          <span> </span>
                          <span className="text-ink">{nextPrayer.time}</span>
                        </span>
                        <ArrowUpRight
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5"
                        />
                      </Link>
                    ) : null}
                  </div>
                </div>
                <h1 className="mt-3 text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-5xl lg:text-5xl">
                  {displayCityName}
                </h1>
                <p className="mt-4 line-clamp-4 text-sm font-medium leading-6 text-ink">
                  {displayLede}
                </p>
                <Link
                  className="group mt-3 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-ink/85"
                  href={cityTodayHref}
                >
                  <span>{cityTodayLabel}</span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                </Link>
                <div className="mt-auto grid gap-3 border-t border-ink/25 pt-3 sm:grid-cols-3">
                  {heroFacts.map((fact) => {
                    const Icon = fact.icon;

                    return (
                      <div
                        className="flex items-center gap-2.5"
                        key={fact.label}
                      >
                        <Icon
                          aria-hidden="true"
                          className="h-5 w-5 shrink-0 text-ink"
                        />
                        <div className="leading-tight">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-ink/80">
                            {fact.label}
                          </p>
                          <p className="text-sm font-bold text-ink">
                            {fact.value}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 pb-2 sm:px-8 lg:px-12">
              <SiteSearchBox
                citySlug={city.slug}
                className="mx-auto max-w-4xl"
                locale={locale}
                placeholder={citySearchCopy.placeholder}
                searchLabel={citySearchCopy.search}
              />
            </div>
            <CityExploreRail
              dir={dir}
              items={cityCategories}
              labels={{
                next: isArabic ? "التالي" : "Next",
                previous: isArabic ? "السابق" : "Previous",
              }}
              title={
                isArabic ? `استكشف ${displayCityName}` : `Explore ${city.name}`
              }
            />
          </div>
        </section>

        {displayItineraries.length > 0 ? (
          <ItineraryPlannerShowcase
            actionHref={`${cityBasePath}/itineraries`}
            dir={dir}
            items={itineraryShowcaseItems}
            labels={{
              action: itineraryCopy.action,
              alternateRoutes: itineraryCopy.more,
              badge: itineraryCopy.badge,
              featured: itineraryCopy.featured,
              map: itineraryCopy.map,
              open: itineraryCopy.open,
              routePreview: itineraryCopy.preview,
            }}
            subtitle={itineraryCopy.subtitle}
            title={itineraryCopy.title}
          />
        ) : null}

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/places-to-visit`}
          items={displayPlaces}
          labels={guideItemLabels}
          limit={primaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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

        {cityInfoArticleCards.length > 0 ? (
          <FeatureRail
            actionHref={`${cityBasePath}/section/city-information`}
            actionLabel={actionLabels.all}
            dir={dir}
            items={cityInfoArticleCards}
            labels={{
              previous: isArabic ? "السابق" : "Previous",
              next: isArabic ? "التالي" : "Next",
            }}
            subtitle={
              isArabic
                ? "اقرأ عن المدينة اليوم، تاريخها، سكانها، وثقافتها قبل أن تبدأ التخطيط."
                : "Read the city today, its history, residents, culture, and character before planning your route."
            }
            title={
              isArabic
                ? `التاريخ والمدينة اليوم في ${displayCityName}`
                : `History and today in ${city.name}`
            }
          />
        ) : null}

        <GuideItemRail
          actionLabel={actionLabels.readMore}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/food-and-restaurants`}
          items={displayRestaurants}
          labels={guideItemLabels}
          limit={primaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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
          items={displayFamilySpots}
          labels={guideItemLabels}
          limit={primaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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
          items={displayHotels}
          labels={guideItemLabels}
          limit={secondaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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
          items={displayShopping}
          labels={guideItemLabels}
          limit={primaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
          subtitle={
            isArabic
              ? `تعرّف إلى ${shopping.length} وجهة تسوق، من المراكز التجارية والأسواق وأسواق الكتب إلى شوارع الأزياء ومحلات الهدايا.`
              : `Explore ${shopping.length} shopping stops, from malls, markets, and book bazaars to fashion streets and souvenir finds.`
          }
          title={
            isArabic
              ? `دليل التسوق في ${displayCityName}`
              : `Shopping in ${city.name}`
          }
        />

        <PracticalCityInfo city={city} locale={locale} />

        {visitorArticleCards.length > 0 ? (
          <FeatureRail
            actionHref={`${cityBasePath}/section/visitor-information`}
            actionLabel={actionLabels.all}
            dir={dir}
            items={visitorArticleCards}
            labels={{
              previous: isArabic ? "السابق" : "Previous",
              next: isArabic ? "التالي" : "Next",
            }}
            subtitle={
              isArabic
                ? "معلومات عملية عن التأشيرات، أفضل وقت للزيارة، الحقائق السريعة، أسعار الصرف، العطلات، والمناخ."
                : "Practical basics for visas, when to go, fast facts, exchange rates, holidays, and weather."
            }
            title={
              isArabic
                ? `معلومات الزائر في ${displayCityName}`
                : `Visitor information for ${city.name}`
            }
          />
        ) : null}

        {transportArticleCards.length > 0 ? (
          <FeatureRail
            actionHref={`${cityBasePath}/section/transportation-and-getting-around`}
            actionLabel={actionLabels.all}
            dir={dir}
            items={transportArticleCards}
            labels={{
              previous: isArabic ? "السابق" : "Previous",
              next: isArabic ? "التالي" : "Next",
            }}
            subtitle={
              isArabic
                ? "المطار، الحافلات، طلب السيارات، السائقون الخاصون، ونصائح الحركة بين مناطق المدينة."
                : "Airport arrivals, buses, ride-hailing, private drivers, and movement advice by city cluster."
            }
            title={
              isArabic
                ? `التنقل والمواصلات في ${displayCityName}`
                : `Getting around ${city.name}`
            }
          />
        ) : null}

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

        <FeatureRail
          actionHref={`${cityBasePath}/section/places-to-visit`}
          actionLabel={actionLabels.all}
          dir={dir}
          items={famousSpots.map((place, index) => {
            const visual = getGuideItemImage(place);
            return {
              key: place.id,
              href: `${localePrefix}${pathForGuideItem(city, place)}`,
              image: visual.image,
              objectPosition: visual.objectPosition,
              imageAlt: place.imageAlt,
              eyebrow:
                place.category && place.category !== place.title
                  ? place.category
                  : undefined,
              title: place.title,
              description: place.originalContent?.[0] ?? place.description,
              discoverLabel: actionLabels.details,
              eager: index < 4,
            };
          })}
          labels={{
            previous: isArabic ? "السابق" : "Previous",
            next: isArabic ? "التالي" : "Next",
          }}
          subtitle={
            isArabic
              ? "مختارات تتغيّر يوميًا من أبرز معالم المدينة."
              : "A daily-changing pick of the city’s standout sights."
          }
          title={
            isArabic
              ? "معالم بارزة في كراتشي"
              : `Signature sights in ${city.name}`
          }
        />

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/festivals-and-annual-events`}
          items={displayFestivals}
          labels={guideItemLabels}
          limit={primaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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
          href={`${cityBasePath}/section/muslim-visitor-information`}
          items={displayMasjids}
          labels={guideItemLabels}
          limit={secondaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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

        <GuideItemRail
          actionLabel={actionLabels.all}
          city={city}
          cityName={displayCityName}
          dir={dir}
          href={`${cityBasePath}/section/organized-tours`}
          items={displayTours}
          labels={guideItemLabels}
          limit={secondaryRailLimit}
          pathPrefix={localePrefix}
          preserveOrder
          sortMode={guideCardSortMode}
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

        <GuideSectionGrid
          city={city}
          cityName={displayCityName}
          locale={locale}
        />
      </main>
    </PageShell>
  );
}

export default async function CityPage(props: Props) {
  return <CityPageContent {...props} />;
}
