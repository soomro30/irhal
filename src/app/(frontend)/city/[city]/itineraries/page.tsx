import { CalendarDays, Clock, Route, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DiscoverPill } from "@/components/discover-action";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityBySlug } from "@/lib/city-source";
import { itineraryHeroImage, itineraryStopCount } from "@/lib/itineraries";
import {
  breadcrumbJsonLd,
  localizedCityName,
  localizedUrl,
  pageMetadata,
} from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

type PageLocale = "en" | "ar";

export async function generateItinerariesMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const cityName = localizedCityName(city, locale);

  return pageMetadata({
    title: locale === "ar" ? `مسارات الرحلة في ${cityName}` : `${cityName} Itineraries`,
    description:
      locale === "ar"
        ? `مسارات ${cityName} حسب الأحياء والأماكن الموثقة والمطاعم الحلال وتخطيط قريب من المساجد.`
        : `Route-aware ${cityName} itineraries using neighborhoods, verified places, halal restaurants, and masjid-aware planning.`,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/itineraries`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateItinerariesMetadata(props);
}

export async function ItinerariesPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();
  const isArabic = locale === "ar";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = isArabic ? `/ar/city/${city.slug}` : `/en/city/${city.slug}`;
  const pageLabel = isArabic ? "مسارات الرحلة" : "Itineraries";
  const dir = isArabic ? "rtl" : "ltr";
  const copy = {
    badge: isArabic ? "مسارات جاهزة للتخطيط" : "Route-aware plans",
    title: isArabic ? `مسارات الرحلة في ${cityName}` : `${city.name} Itineraries`,
    intro: isArabic
      ? "اختر مسارا جاهزا حسب مدة الرحلة ونوع المسافر، مع محطات مترابطة حسب الأحياء والمعالم والمطاعم الحلال وإيقاع مناسب للعائلات."
      : "Choose a ready route by trip length and traveler style, with connected neighborhoods, landmarks, halal-friendly food stops, and family-aware pacing.",
    day: isArabic ? "يوم" : "day",
    days: isArabic ? "أيام" : "days",
    stops: isArabic ? "محطات" : "stops",
    open: isArabic ? "فتح المسار" : "Open itinerary",
    ready: isArabic ? "جاهز للتخطيط" : "Ready to plan",
  };

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        { label: pageLabel },
      ]}
      locale={locale}
    >
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: city.name, path: cityBasePath },
              { name: pageLabel, path: `${cityBasePath}/itineraries` },
            ],
            locale,
          ),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: city.itineraries.map((itinerary, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: `${localizedUrl(`/city/${city.slug}/itineraries`, locale)}#${itinerary.slug}`,
              name: itinerary.title,
            })),
          },
        ]}
      />
      <main
        className={isArabic ? "mx-auto max-w-7xl px-5 py-8 font-arabic" : "mx-auto max-w-7xl px-5 py-8"}
        dir={dir}
      >
        <div>
          <Badge variant="secondary">
            <Route aria-hidden="true" className="h-4 w-4" />
            {copy.badge}
          </Badge>
          <h1 className="mt-3 text-4xl font-black text-ink">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/65">
            {copy.intro}
          </p>
        </div>

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {city.itineraries.map((itinerary, index) => {
            const href = `${cityBasePath}/itineraries/${itinerary.slug}`;
            const dayLabel =
              itinerary.durationDays === 1 ? copy.day : copy.days;

            return (
              <Card
                className="group overflow-hidden shadow-sm transition hover:-translate-y-0.5 hover:border-coastal/40 hover:shadow-[0_22px_58px_rgba(0,109,119,0.14)]"
                id={itinerary.slug}
                key={itinerary.slug}
              >
                <Link
                  aria-label={`${copy.open}: ${itinerary.title}`}
                  className="relative block aspect-[16/10] overflow-hidden bg-ink"
                  href={href}
                >
                  <Image
                    alt=""
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fill
                    loading={index < 3 ? "eager" : "lazy"}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 390px"
                    src={itineraryHeroImage({ city, itinerary, locale })}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                    <Badge variant="saffron">{copy.ready}</Badge>
                    <Badge variant="secondary">{itinerary.audience}</Badge>
                  </div>
                </Link>
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-3 text-xs font-black uppercase text-ink/60">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays aria-hidden="true" className="h-4 w-4" />
                      {itinerary.durationDays} {dayLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Route aria-hidden="true" className="h-4 w-4" />
                      {itineraryStopCount(itinerary)} {copy.stops}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users aria-hidden="true" className="h-4 w-4" />
                      {itinerary.audience}
                    </span>
                  </div>
                  <h2 className="mt-3 text-2xl font-black leading-tight text-ink">
                    <Link className="hover:underline" href={href}>
                      {itinerary.title}
                    </Link>
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-ink/65">
                    {itinerary.summary}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <Link href={href}>
                      <DiscoverPill label={copy.open} />
                    </Link>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-ink/55">
                      <Clock aria-hidden="true" className="h-4 w-4" />
                      {itinerary.days.length}{" "}
                      {itinerary.days.length === 1 ? copy.day : copy.days}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </main>
    </PageShell>
  );
}

export default async function ItinerariesPage(props: Props) {
  return <ItinerariesPageContent {...props} />;
}
