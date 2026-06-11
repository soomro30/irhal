import { CalendarDays, DollarSign, Languages } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { CityHeroCarousel } from "@/components/city-hero-carousel";
import {
  CityExploreRail,
  type CityExploreItem,
} from "@/components/city-explore-rail";
import { PageShell } from "@/components/page-shell";
import { FeatureRail } from "@/components/feature-rail";
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
  formatItineraryDuration,
  formatItineraryStopCount,
  itineraryCardImageMap,
  itineraryStopCount,
  localizeItinerary,
} from "@/lib/itineraries";
import {
  getGuideArticlesForSection,
  getGuideItemsByKind,
  getGuideItemsForSection,
  getLocalizedGuideSectionCopy,
  itineraryGuideSectionSlug,
  localizeGuideItem,
  pathForGuideItem,
  type GuideItem,
} from "@/lib/guide-items";
import { breadcrumbJsonLd, cityJsonLd, pageMetadata } from "@/lib/seo";

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
    open: isArabic ? "فتح المسار" : "Open itinerary",
    subtitle: itinerarySectionCopy.summary,
    title: isArabic
      ? `مسارات الرحلة في ${displayCityName}`
      : `${city.name} itineraries`,
  };

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
        <section className="border-b border-ink/10 bg-white">
          <div className="bg-ink text-white">
            <div className="mx-auto max-w-7xl px-6 pt-10 sm:px-8 lg:px-12 lg:pt-12">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/80">
                {displayCountry}
              </p>
              <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                {displayCityName}
              </h1>
              <p className="mt-4 max-w-5xl text-base leading-7 text-white/85">
                {displayLede}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/15 pt-4">
                {heroFacts.map((fact) => {
                  const Icon = fact.icon;

                  return (
                    <div className="flex items-center gap-2.5" key={fact.label}>
                      <Icon
                        aria-hidden="true"
                        className="h-5 w-5 shrink-0 text-white/65"
                      />
                      <div className="leading-tight">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                          {fact.label}
                        </p>
                        <p className="text-sm font-bold text-white">
                          {fact.value}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
              <div className="relative mt-8 h-[340px] w-full overflow-hidden rounded-xl lg:h-[460px]">
                <CityHeroCarousel
                  alt={`${displayCityName} travel banner`}
                  dir={dir}
                  frameClassName="absolute inset-0"
                  images={heroImages}
                  labels={{
                    next: isArabic ? "عرض الصورة التالية" : "Show next banner image",
                    previous: isArabic
                      ? "عرض الصورة السابقة"
                      : "Show previous banner image",
                    slide: isArabic ? "صورة البانر" : "Banner image",
                  }}
                  sizes="(min-width: 1440px) 1392px, 100vw"
                />
              </div>
            </div>
          </div>

          <CityExploreRail
            dir={dir}
            eyebrow={isArabic ? "دليل المدينة" : "City guide"}
            items={cityCategories}
            labels={{
              next: isArabic ? "التالي" : "Next",
              previous: isArabic ? "السابق" : "Previous",
            }}
            title={isArabic ? `استكشف ${displayCityName}` : `Explore ${city.name}`}
          />
        </section>

        {displayItineraries.length > 0 ? (
          <FeatureRail
            actionHref={`${cityBasePath}/itineraries`}
            actionLabel={itineraryCopy.action}
            dir={dir}
            items={displayItineraries.map((itinerary, index) => ({
              key: itinerary.slug,
              href: `${cityBasePath}/itineraries/${itinerary.slug}`,
              image: itineraryCardImages[itinerary.slug],
              imageAlt: itinerary.title,
              eyebrow: `${formatItineraryDuration(
                itinerary.durationDays,
                locale,
              )} · ${formatItineraryStopCount(
                itineraryStopCount(itinerary),
                locale,
              )}`,
              title: itinerary.title,
              description: itinerary.summary,
              discoverLabel: itineraryCopy.open,
              eager: index < 4,
            }))}
            labels={{
              previous: isArabic ? "السابق" : "Previous",
              next: isArabic ? "التالي" : "Next",
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
            isArabic ? "معالم بارزة في كراتشي" : `Signature sights in ${city.name}`
          }
        />

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
