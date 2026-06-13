import { Globe2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { CityHeroCarousel } from "@/components/city-hero-carousel";
import { FeatureRail, type FeatureCardData } from "@/components/feature-rail";
import { PageShell } from "@/components/page-shell";
import { SiteSearchBox } from "@/components/site-search-box";
import { getCityNavItems, preloadCityBySlug, type CityNavItem } from "@/lib/city-source";
import { genericGuidePlaceholderImage } from "@/lib/image-placeholders";
import { pageMetadata } from "@/lib/seo";

type HomeLocale = "en" | "ar";

const fallbackCityImage = genericGuidePlaceholderImage;

const seededNumber = (value: string) =>
  [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    2166136261,
  );

const rotateHeroCities = (cities: CityNavItem[]) => {
  if (cities.length <= 1) return cities;

  const daySeed = new Date().toISOString().slice(0, 10);
  const startIndex = seededNumber(`homepage-hero-${daySeed}`) % cities.length;
  const rotated = [...cities.slice(startIndex), ...cities.slice(0, startIndex)];

  if (rotated[0]?.slug === "karachi") {
    const nonKarachiIndex = rotated.findIndex((city) => city.slug !== "karachi");
    if (nonKarachiIndex > 0) {
      return [
        ...rotated.slice(nonKarachiIndex),
        ...rotated.slice(0, nonKarachiIndex),
      ];
    }
  }

  return rotated;
};

export function homeMetadata(locale: HomeLocale): Metadata {
  const isArabic = locale === "ar";
  return pageMetadata({
    title: isArabic
      ? "إرحل | أدلة المدن والسفر"
      : "Irhal | City guides and travel planning",
    description: isArabic
      ? "ابدأ رحلتك من أدلة مدن إرحل: وجهات، أماكن، فنادق، مطاعم، وتسوق، ومعلومات عملية للمسافر."
      : "Explore Irhal city guides with practical travel essentials, places to visit, hotels, restaurants, shopping, and Muslim-friendly planning.",
    path: isArabic ? "/" : "/en",
  });
}

export const metadata = homeMetadata("ar");

const localizedCity = (city: CityNavItem, locale: HomeLocale): CityNavItem => {
  if (locale !== "ar") return city;

  const arabic = city.translations?.ar;
  const translatedName =
    typeof arabic?.name === "string" && arabic.name ? arabic.name : undefined;
  const translatedCountry =
    typeof arabic?.countryName === "string" && arabic.countryName
      ? arabic.countryName
      : undefined;

  if (translatedName || translatedCountry) {
    return {
      ...city,
      country: translatedCountry ?? city.country,
      name: translatedName ?? city.name,
    };
  }

  if (city.slug === "karachi") {
    return { ...city, country: "باكستان", name: "كراتشي" };
  }

  return city;
};

export async function HomeContent({ locale = "en" }: { locale?: HomeLocale }) {
  preloadCityBySlug("karachi");
  const isArabic = locale === "ar";
  const prefix = isArabic ? "/ar" : "/en";
  const cityItems = (await getCityNavItems()).map((city) =>
    localizedCity(city, locale),
  );
  const featuredCities = cityItems.slice(0, 5);
  const heroCities = rotateHeroCities(cityItems);
  const heroImages = Array.from(
    new Set(
      heroCities
        .map((city) => city.heroImageUrl)
        .filter((image): image is string => Boolean(image)),
    ),
  );
  const carouselImages =
    heroImages.length > 0 ? heroImages : [fallbackCityImage];
  const destinationCards: FeatureCardData[] = featuredCities.map(
    (city, index) => ({
      key: city.slug,
      href: `${prefix}/city/${city.slug}`,
      image: city.cardImageUrl || city.heroImageUrl || fallbackCityImage,
      imageAlt: city.name,
      eyebrow: city.country,
      title: city.name,
      discoverLabel: isArabic ? "اكتشف" : "Discover",
      eager: index < 4,
    }),
  );

  const t = isArabic
    ? {
        heading: "اكتشف مدينتك التالية مع إرحل.",
        intro:
          "شريكك في السفر الإسلامي لاكتشاف المدن والأماكن والطعام الحلال والتخطيط العملي بثقة.",
        searchPlaceholder: "ابحث عن مدينة أو مكان",
        search: "بحث",
        popular: "المدن المتاحة",
        pickHeading: "اختر دليل مدينة",
        pickIntro:
          "تصفّح أدلة المدن حسب الوجهة، ثم انتقل مباشرة إلى الأماكن والفنادق والمطاعم والتسوق ونصائح التخطيط.",
        viewCity: "عرض الدليل",
      }
    : {
        heading: "Discover your next city with Irhal.",
        intro:
          "Your Islamic travel partner for city guides, halal food, hotels, tours, and practical planning.",
        searchPlaceholder: "Find places and things to do",
        search: "Search",
        popular: "Available city guides",
        pickHeading: "Choose a city guide",
        pickIntro:
          "Browse by destination, then jump straight into sights, hotels, restaurants, shopping, maps, and planning tips.",
        viewCity: "View guide",
      };

  return (
    <PageShell locale={locale}>
      <main dir={isArabic ? "rtl" : "ltr"}>
        <section className="relative h-[58svh] min-h-[430px] max-h-[620px] overflow-hidden bg-ink text-white">
          <CityHeroCarousel
            alt={isArabic ? "صور وجهات إرحل" : "Irhal city guide hero images"}
            autoAdvanceMs={6000}
            backdropClassName="object-cover object-center opacity-55 blur-xl scale-105"
            dir={isArabic ? "rtl" : "ltr"}
            frameClassName="absolute inset-0 bg-ink"
            imageClassName="object-contain object-center"
            images={carouselImages}
            labels={{
              next: isArabic ? "عرض المدينة التالية" : "Show next city image",
              previous: isArabic
                ? "عرض المدينة السابقة"
                : "Show previous city image",
              slide: isArabic ? "صورة مدينة" : "City image",
            }}
            mirrorForRtl={false}
            objectFit="contain"
            sizes="100vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/45 via-black/10 to-transparent rtl:bg-gradient-to-l" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/25 to-transparent" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-12 pt-6 md:pb-16 md:pt-8">
            <div className="max-w-3xl">
              <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-white drop-shadow md:text-5xl">
                {t.heading}
              </h1>
              <div className="mt-4 max-w-3xl bg-irhal-yellow p-4 text-ink shadow-xl md:p-5">
                <p className="max-w-2xl text-sm font-bold leading-6 md:text-base md:leading-7">
                  {t.intro}
                </p>
                <SiteSearchBox
                  className="mt-4"
                  locale={locale}
                  placeholder={t.searchPlaceholder}
                  searchLabel={t.search}
                />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-white">
                <span className="inline-flex items-center gap-2">
                  <Globe2 aria-hidden="true" className="h-4 w-4" />
                  {t.popular}
                </span>
                {featuredCities.map((city) => (
                  <Link
                    className="rounded-full bg-white/92 px-3 py-1.5 text-ink transition hover:bg-irhal-yellow"
                    href={`${prefix}/city/${city.slug}`}
                    key={city.slug}
                  >
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <FeatureRail
          actionHref={`${prefix}/search`}
          actionLabel={isArabic ? "عرض الكل" : "View all"}
          dir={isArabic ? "rtl" : "ltr"}
          items={destinationCards}
          labels={{
            previous: isArabic ? "السابق" : "Previous",
            next: isArabic ? "التالي" : "Next",
          }}
          subtitle={t.pickIntro}
          title={isArabic ? "وجهات مختارة" : "Featured destinations"}
        />
      </main>
    </PageShell>
  );
}

export default function Home() {
  return <HomeContent locale="ar" />;
}
