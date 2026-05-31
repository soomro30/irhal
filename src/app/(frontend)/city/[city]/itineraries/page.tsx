import { Route } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCityBySlug } from "@/lib/city-source";
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
      <main className="mx-auto max-w-7xl px-5 py-8">
        <div>
          <Badge variant="secondary">
            <Route aria-hidden="true" className="h-4 w-4" />
            Route-aware plans
          </Badge>
          <h1 className="mt-3 text-4xl font-black text-ink">
            {city.name} Itineraries
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/65">
            Use these day plans to connect neighborhoods, landmarks, food
            stops, masjids, and family-friendly pacing without crossing the
            city more than you need to.
          </p>
        </div>

        <section className="mt-8 grid gap-5">
          {city.itineraries.map((itinerary) => (
            <Card id={itinerary.slug} key={itinerary.slug}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink/55">
                      {itinerary.durationDays} day · {itinerary.audience}
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-ink">
                      {itinerary.title}
                    </h2>
                  </div>
                  <Badge variant="saffron">Ready to plan</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-ink/65">{itinerary.summary}</p>
                <div className="mt-5 grid gap-4">
                  {itinerary.days.map((day) => (
                    <div
                      className="border-l-2 border-coastal pl-4"
                      key={day.dayNumber}
                    >
                      <h3 className="font-bold text-ink">
                        Day {day.dayNumber}: {day.theme}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {day.routeNotes}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {day.stops.map((stop) => (
                          <span
                            className="rounded-md bg-paper-deep px-3 py-1 text-sm font-bold text-ink/75"
                            key={stop}
                          >
                            {stop}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      </main>
    </PageShell>
  );
}

export default async function ItinerariesPage(props: Props) {
  return <ItinerariesPageContent {...props} />;
}
