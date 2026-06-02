import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Clock3,
  Coffee,
  ExternalLink,
  Hotel,
  MapPin,
  Route,
  Sunrise,
  Utensils,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ItineraryPdfButton } from "@/components/itinerary-pdf-button";
import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCityBySlug } from "@/lib/city-source";
import {
  itineraryHeroImage,
  itineraryStopCount,
  resolveItineraryStops,
} from "@/lib/itineraries";
import {
  breadcrumbJsonLd,
  localizedCityName,
  localizedUrl,
  pageMetadata,
} from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; itinerary: string }>;
};

type PageLocale = "en" | "ar";

const findItinerary = async ({ params }: Props) => {
  const { city: citySlug, itinerary: itinerarySlug } = await params;
  const city = await getCityBySlug(citySlug);
  const itinerary = city?.itineraries.find((item) => item.slug === itinerarySlug);

  return { city, itinerary };
};

export async function generateItineraryMetadata(
  props: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city, itinerary } = await findItinerary(props);
  if (!city || !itinerary) return {};

  const cityName = localizedCityName(city, locale);

  return pageMetadata({
    title: `${itinerary.title} | ${cityName}`,
    description: itinerary.summary,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/itineraries/${itinerary.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateItineraryMetadata(props);
}

export async function ItineraryDetailPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, itinerary: itinerarySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const itinerary = city.itineraries.find((item) => item.slug === itinerarySlug);
  if (!itinerary) notFound();

  const isArabic = locale === "ar";
  const dir = isArabic ? "rtl" : "ltr";
  const cityName = localizedCityName(city, locale);
  const cityBasePath = isArabic ? `/ar/city/${city.slug}` : `/en/city/${city.slug}`;
  const itineraryBasePath = `${cityBasePath}/itineraries`;
  const resolvedDays = resolveItineraryStops({ city, itinerary, locale });
  const stopCount = itineraryStopCount(itinerary);
  const dayLabel =
    itinerary.durationDays === 1
      ? isArabic
        ? "يوم"
        : "day"
      : isArabic
        ? "أيام"
        : "days";
  const copy = {
    allItineraries: isArabic ? "كل المسارات" : "All itineraries",
    audience: isArabic ? "نوع الرحلة" : "Audience",
    breakfast: isArabic ? "الفطور" : "Breakfast",
    day: isArabic ? "اليوم" : "Day",
    details: isArabic ? "التفاصيل" : "Details",
    dinner: isArabic ? "العشاء" : "Dinner",
    duration: isArabic ? "المدة" : "Duration",
    export: isArabic ? "تصدير PDF" : "Export PDF",
    introBadge: isArabic ? "مسار قابل للتنزيل" : "Downloadable itinerary",
    lunch: isArabic ? "الغداء" : "Lunch",
    map: isArabic ? "الخريطة" : "Map",
    mealPlan: isArabic ? "خطة الطعام" : "Meal plan",
    overview: isArabic ? "نظرة عامة" : "Overview",
    pacing: isArabic ? "الإيقاع" : "Pacing",
    plan: isArabic ? "خطط الرحلة" : "Plan the trip",
    routeNote: isArabic ? "ملاحظة المسار" : "Route note",
    routeStops: isArabic ? "محطات المسار" : "Route stops",
    snapshot: isArabic ? "ملخص المسار" : "Route snapshot",
    startDay: isArabic ? "بداية اليوم" : "Start the day",
    stops: isArabic ? "محطات" : "stops",
    transport: isArabic ? "المواصلات" : "Transport",
    whereToStay: isArabic ? "مكان الإقامة" : "Where to stay",
  };
  const mealPlan = itinerary.planning?.meals
    ? [
        itinerary.planning.meals.breakfast &&
          `${copy.breakfast}: ${itinerary.planning.meals.breakfast}`,
        itinerary.planning.meals.lunch &&
          `${copy.lunch}: ${itinerary.planning.meals.lunch}`,
        itinerary.planning.meals.dinner &&
          `${copy.dinner}: ${itinerary.planning.meals.dinner}`,
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;
  const planningCards = [
    {
      body: itinerary.planning?.stay,
      Icon: Hotel,
      title: copy.whereToStay,
    },
    {
      body: itinerary.planning?.transport,
      Icon: CarFront,
      title: copy.transport,
    },
    {
      body: mealPlan,
      Icon: Utensils,
      title: copy.mealPlan,
    },
  ].filter((item) => item.body);

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        { label: isArabic ? "مسارات الرحلة" : "Itineraries", href: itineraryBasePath },
        { label: itinerary.title },
      ]}
      locale={locale}
    >
      <JsonLd
        data={[
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: city.name, path: cityBasePath },
              { name: "Itineraries", path: itineraryBasePath },
              {
                name: itinerary.title,
                path: `${itineraryBasePath}/${itinerary.slug}`,
              },
            ],
            locale,
          ),
          {
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: itinerary.title,
            description: itinerary.summary,
            itinerary: resolvedDays.flatMap((day) =>
              day.stops.map((stop) => stop.title),
            ),
            touristType: itinerary.audience,
            url: localizedUrl(
              `/city/${city.slug}/itineraries/${itinerary.slug}`,
              locale,
            ),
          },
        ]}
      />

      <main
        className={isArabic ? "font-arabic print:bg-white" : "print:bg-white"}
        dir={dir}
      >
        <section className="relative overflow-hidden bg-ink text-white print:bg-white print:text-ink">
          <div className="absolute inset-0 print:hidden">
            <Image
              alt=""
              className="object-cover"
              fetchPriority="high"
              fill
              loading="eager"
              sizes="100vw"
              src={itineraryHeroImage({ city, itinerary, locale })}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20 rtl:bg-gradient-to-l" />
          </div>
          <div className="relative mx-auto max-w-7xl px-5 py-12 md:py-16 print:py-6">
            <div className="max-w-3xl">
              <Badge variant="saffron">{copy.introBadge}</Badge>
              <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl print:text-3xl">
                {itinerary.title}
              </h1>
              <p className="mt-5 text-lg leading-8 text-white/85 print:text-ink/70">
                {itinerary.summary}
              </p>
              {itinerary.intro ? (
                <p className="mt-4 text-base leading-7 text-white/75 print:text-ink/65">
                  {itinerary.intro}
                </p>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold">
                <span className="inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 print:border print:border-ink/15 print:bg-white">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  {itinerary.durationDays} {dayLabel}
                </span>
                <span className="inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 print:border print:border-ink/15 print:bg-white">
                  <Route aria-hidden="true" className="h-4 w-4" />
                  {stopCount} {copy.stops}
                </span>
                <span className="inline-flex items-center gap-2 rounded-md bg-white/12 px-3 py-2 print:border print:border-ink/15 print:bg-white">
                  <Users aria-hidden="true" className="h-4 w-4" />
                  {itinerary.audience}
                </span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 print:hidden">
                <ItineraryPdfButton label={copy.export} />
                <Button asChild variant="outline">
                  <Link href={itineraryBasePath}>
                    <ArrowLeft aria-hidden="true" />
                    {copy.allItineraries}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {planningCards.length > 0 ? (
          <section className="mx-auto max-w-7xl px-5 pt-8 print:px-0 print:pt-4">
            <div className="mb-4">
              <p className="text-sm font-black uppercase tracking-wide text-irhal-red">
                {copy.plan}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink">
                {copy.overview}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {planningCards.map(({ body, Icon, title }) => (
                <div
                  className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm print:shadow-none"
                  key={title}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-coastal/10 text-coastal">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <h3 className="text-base font-black text-ink">{title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink/65">{body}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_320px] print:block print:px-0 print:py-4">
          <div className="grid gap-6">
            {resolvedDays.map((day) => {
              const dayPlanningItems = [
                {
                  Icon: Sunrise,
                  label: copy.startDay,
                  value: day.start,
                },
                {
                  Icon: CarFront,
                  label: copy.transport,
                  value: day.transport,
                },
                {
                  Icon: Coffee,
                  label: copy.breakfast,
                  value: day.breakfast,
                },
                {
                  Icon: Utensils,
                  label: copy.lunch,
                  value: day.lunch,
                },
                {
                  Icon: Utensils,
                  label: copy.dinner,
                  value: day.dinner,
                },
                {
                  Icon: Clock3,
                  label: copy.pacing,
                  value: day.pacing,
                },
              ].filter((item) => item.value);

              return (
                <Card
                  className="break-inside-avoid shadow-sm print:border-ink/20 print:shadow-none"
                  key={day.dayNumber}
                >
                  <CardHeader>
                    <p className="text-sm font-black uppercase tracking-wide text-irhal-red">
                      {copy.day} {day.dayNumber}
                    </p>
                    <h2 className="text-3xl font-black tracking-tight text-ink">
                      {day.theme}
                    </h2>
                    {day.description ? (
                      <p className="max-w-3xl text-base leading-7 text-ink/75">
                        {day.description}
                      </p>
                    ) : null}
                    <p className="max-w-3xl text-sm leading-6 text-ink/60">
                      <span className="font-black text-ink">{copy.routeNote}: </span>
                      {day.routeNotes}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {dayPlanningItems.length > 0 ? (
                      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {dayPlanningItems.map(({ Icon, label, value }) => (
                          <div
                            className="rounded-lg border border-ink/10 bg-white p-4"
                            key={`${day.dayNumber}-${label}`}
                          >
                            <div className="flex items-center gap-2 text-sm font-black text-ink">
                              <Icon
                                aria-hidden="true"
                                className="h-4 w-4 text-coastal"
                              />
                              {label}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-ink/65">
                              {value}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="grid gap-4">
                      {day.stops.map((stop, index) => (
                        <article
                          className="grid gap-4 rounded-lg border border-ink/10 bg-paper/60 p-3 sm:grid-cols-[150px_minmax(0,1fr)] print:grid-cols-[120px_minmax(0,1fr)] print:bg-white"
                          key={`${day.dayNumber}-${stop.slug}-${index}`}
                        >
                          <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-ink/10">
                            <Image
                              alt={stop.imageAlt}
                              className="object-cover"
                              fill
                              sizes="(max-width: 640px) 100vw, 150px"
                              src={stop.imageUrl}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-ink/50">
                              {index + 1}. {stop.eyebrow}
                            </p>
                            <h3 className="mt-1 text-xl font-black text-ink">
                              {stop.href ? (
                                <Link className="hover:underline" href={stop.href}>
                                  {stop.title}
                                </Link>
                              ) : (
                                stop.title
                              )}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-ink/65">
                              {stop.description}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold print:hidden">
                              {stop.href ? (
                                <Link
                                  className="inline-flex items-center gap-1 text-coastal hover:underline"
                                  href={stop.href}
                                >
                                  {copy.details}
                                  <ExternalLink
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                  />
                                </Link>
                              ) : null}
                              {stop.mapUrl ? (
                                <a
                                  className="inline-flex items-center gap-1 text-coastal hover:underline"
                                  href={stop.mapUrl}
                                >
                                  <MapPin aria-hidden="true" className="h-4 w-4" />
                                  {copy.map}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <aside className="print:hidden">
            <Card className="sticky top-24 shadow-sm">
              <CardHeader>
                <p className="text-sm font-black uppercase tracking-wide text-irhal-red">
                  {copy.snapshot}
                </p>
                <h2 className="text-2xl font-black text-ink">
                  {copy.overview}
                </h2>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
                    <span className="font-bold text-ink/60">{copy.duration}</span>
                    <span className="font-black text-ink">
                      {itinerary.durationDays} {dayLabel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-3">
                    <span className="font-bold text-ink/60">{copy.routeStops}</span>
                    <span className="font-black text-ink">{stopCount}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-ink/60">{copy.audience}</span>
                    <span className="font-black text-ink">{itinerary.audience}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

export default async function ItineraryDetailPage(props: Props) {
  return <ItineraryDetailPageContent {...props} />;
}
