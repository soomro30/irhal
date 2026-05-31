import { ExternalLink, MoonStar } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getListingsByTypes } from "@/lib/city-data";
import { getCityBySlug } from "@/lib/city-source";
import { breadcrumbJsonLd, localizedCityName, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

type PageLocale = "en" | "ar";

export async function generateIslamicTravelMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const cityName = localizedCityName(city, locale);

  return pageMetadata({
    title:
      locale === "ar"
        ? `دليل السفر الإسلامي في ${cityName}`
        : `${cityName} Islamic Travel Guide`,
    description:
      locale === "ar"
        ? `دليل ${cityName} للمطاعم الحلال والمساجد ومناطق الصلاة والمعالم المناسبة للمسافر المسلم.`
        : city.sections.muslimTravel,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/islamic-travel`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateIslamicTravelMetadata(props);
}

export async function IslamicTravelPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const listings = getListingsByTypes(city, [
    "masjid",
    "prayer-area",
    "restaurant",
    "islamic-landmark",
  ]);
  const isArabic = locale === "ar";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = isArabic ? `/ar/city/${city.slug}` : `/en/city/${city.slug}`;
  const pageLabel = isArabic ? "السفر الإسلامي" : "Islamic Travel";

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
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: city.name, path: cityBasePath },
            { name: pageLabel, path: `${cityBasePath}/islamic-travel` },
          ],
          locale,
        )}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="saffron">
              <MoonStar aria-hidden="true" className="h-4 w-4" />
              Muslim travel layer
            </Badge>
            <h1 className="mt-3 text-4xl font-black text-ink">
              {city.name} Islamic Travel
            </h1>
            <p className="mt-4 text-lg leading-8 text-ink/65">
              {city.sections.muslimTravel}
            </p>
          </div>
          <MapPanel
            markers={listings.map((listing) => ({
              label: listing.name,
              latitude: listing.latitude,
              longitude: listing.longitude,
              tone:
                listing.listingType === "masjid"
                  ? ("gold" as const)
                  : ("green" as const),
            }))}
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            [
              "Masjid Directory",
              "Curated masjid entries plus live neighborhood map locator links.",
            ],
            [
              "Halal Food Tagging",
              "Find halal-friendly food, family dining notes, and areas known for classic local meals.",
            ],
            [
              "Prayer Area Awareness",
              "Check place details for prayer facilities, family suitability, and visitor etiquette.",
            ],
          ].map(([title, copy]) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-ink/65">{copy}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black text-ink">
              Muslim Travel Listings
            </h2>
            <a
              className="inline-flex items-center gap-2 text-sm font-bold text-coastal hover:underline"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`masjids halal restaurants ${city.name}`)}`}
            >
              Live map search
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                city={city}
                key={listing.slug}
                listing={listing}
                locale={locale}
              />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default async function IslamicTravelPage(props: Props) {
  return <IslamicTravelPageContent {...props} />;
}
