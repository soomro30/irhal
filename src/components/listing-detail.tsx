import { ExternalLink, MapPin, MoonStar } from "lucide-react";
import Link from "next/link";

import { pathForListing, type CityGuide, type Listing } from "@/lib/city-data";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { JsonLd } from "./json-ld";
import { MapPanel } from "./map-panel";
import { PageShell } from "./page-shell";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/seo";

export function ListingDetail({
  city,
  listing,
  locale = "en",
}: {
  city: CityGuide;
  listing: Listing;
  locale?: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const localePrefix = isArabic ? "/ar" : "/en";
  const cityBasePath = `${localePrefix}/city/${city.slug}`;
  const neighborhood = city.neighborhoods.find(
    (item) => item.slug === listing.neighborhoodSlug,
  );

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        ...(neighborhood
          ? [
              {
                label: neighborhood.name,
                href: `${cityBasePath}/neighborhood/${neighborhood.slug}`,
              },
            ]
          : []),
        { label: listing.name },
      ]}
      locale={locale}
    >
      <JsonLd
        data={[
          listingJsonLd(city, listing, locale),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: city.name, path: `/city/${city.slug}` },
            {
              name: listing.name,
              path: pathForListing(city, listing),
            },
          ], locale),
        ]}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Badge variant="secondary">{listing.listingType}</Badge>
            <h1 className="mt-3 text-4xl font-black text-ink md:text-5xl">
              {listing.name}
            </h1>
            <p className="mt-4 text-lg leading-8 text-ink/65">
              {listing.shortDescription}
            </p>
            <div className="mt-6 grid gap-3 text-sm text-ink/75">
              <p className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {listing.address}
              </p>
              <p>
                Coordinates: {listing.latitude.toFixed(5)},{" "}
                {listing.longitude.toFixed(5)}
              </p>
              {neighborhood ? (
                <p>
                  Area:{" "}
                  <Link
                    className="font-semibold underline"
                    href={`${cityBasePath}/neighborhood/${neighborhood.slug}`}
                  >
                    {neighborhood.name}
                  </Link>
                </p>
              ) : null}
              {listing.muslimTravel?.isHalal ||
              listing.muslimTravel?.womenPrayerArea ||
              listing.listingType === "masjid" ? (
                <p className="inline-flex items-center gap-2 text-coastal">
                  <MoonStar aria-hidden="true" className="h-4 w-4" />
                  Muslim travel attributes available
                </p>
              ) : null}
            </div>
            <Button asChild className="mt-6">
              <a href={listing.mapUrl}>
                Open map locator
                <ExternalLink aria-hidden="true" />
              </a>
            </Button>
          </div>
          <MapPanel
            markers={[
              {
                label: listing.name,
                latitude: listing.latitude,
                longitude: listing.longitude,
              },
            ]}
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Good to know</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-ink/65">
                {listing.seo.description}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-ink/65">
                Last verified {listing.lastVerifiedAt}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Location details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-ink/65">
                Use the map link before you leave, and confirm the route from
                your hotel or neighborhood.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </PageShell>
  );
}
