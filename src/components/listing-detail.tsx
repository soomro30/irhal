import { ExternalLink, MapPin, MoonStar } from "lucide-react";
import Link from "next/link";

import type { CityGuide, Listing } from "@/lib/city-data";
import { JsonLd } from "./json-ld";
import { MapPanel } from "./map-panel";
import { PageShell } from "./page-shell";
import { breadcrumbJsonLd, listingJsonLd } from "@/lib/seo";

export function ListingDetail({ city, listing }: { city: CityGuide; listing: Listing }) {
  const neighborhood = city.neighborhoods.find((item) => item.slug === listing.neighborhoodSlug);

  return (
    <PageShell>
      <JsonLd
        data={[
          listingJsonLd(city, listing),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: city.name, path: `/city/${city.slug}` },
            { name: listing.name, path: `/city/${city.slug}/place/${listing.slug}` },
          ]),
        ]}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href={`/city/${city.slug}`}>
          Back to {city.name}
        </Link>
        <section className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{listing.listingType}</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-950 md:text-5xl">{listing.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{listing.shortDescription}</p>
            <div className="mt-6 grid gap-3 text-sm text-slate-700">
              <p className="inline-flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {listing.address}
              </p>
              <p>
                Coordinates: {listing.latitude.toFixed(5)}, {listing.longitude.toFixed(5)}
              </p>
              {neighborhood ? (
                <p>
                  Area:{" "}
                  <Link className="font-semibold underline" href={`/city/${city.slug}/neighborhood/${neighborhood.slug}`}>
                    {neighborhood.name}
                  </Link>
                </p>
              ) : null}
              {listing.muslimTravel?.isHalal || listing.muslimTravel?.womenPrayerArea || listing.listingType === "masjid" ? (
                <p className="inline-flex items-center gap-2 text-emerald-800">
                  <MoonStar aria-hidden="true" className="h-4 w-4" />
                  Muslim travel attributes available
                </p>
              ) : null}
            </div>
            <a className="mt-6 inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white" href={listing.mapUrl}>
              Open map locator
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <MapPanel markers={[{ label: listing.name, latitude: listing.latitude, longitude: listing.longitude }]} />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">SEO Status</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{listing.seo.description}</p>
          </article>
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">Verification</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Last verified {listing.lastVerifiedAt}</p>
          </article>
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="text-base font-semibold">CMS Rule</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This listing is valid only with coordinates, map URL, city, neighborhood, SEO fields, and source logs.
            </p>
          </article>
        </section>
      </main>
    </PageShell>
  );
}
