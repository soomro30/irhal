import { ExternalLink, MoonStar } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { getCityBySlug, getListingsByTypes } from "@/lib/city-data";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return pageMetadata({
    title: `${city.name} Islamic Travel Guide`,
    description: city.sections.muslimTravel,
    path: `/city/${city.slug}/islamic-travel`,
  });
}

export default async function IslamicTravelPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  const listings = getListingsByTypes(city, ["masjid", "prayer-area", "restaurant", "islamic-landmark"]);

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: city.name, path: `/city/${city.slug}` },
          { name: "Islamic Travel", path: `/city/${city.slug}/islamic-travel` },
        ])}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href={`/city/${city.slug}`}>
          Back to {city.name}
        </Link>
        <section className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
              <MoonStar aria-hidden="true" className="h-4 w-4" />
              Muslim travel layer
            </p>
            <h1 className="mt-3 text-4xl font-bold">{city.name} Islamic Travel</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{city.sections.muslimTravel}</p>
          </div>
          <MapPanel
            markers={listings.map((listing) => ({
              label: listing.name,
              latitude: listing.latitude,
              longitude: listing.longitude,
              tone: listing.listingType === "masjid" ? ("gold" as const) : ("green" as const),
            }))}
          />
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Masjid Directory</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Curated masjid entries plus live neighborhood map locator links.</p>
          </article>
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Halal Food Tagging</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Restaurant records carry halal, family, and verification notes.</p>
          </article>
          <article className="border border-slate-200 bg-white p-5">
            <h2 className="font-semibold">Prayer Area Awareness</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Women prayer area fields are explicit and never inferred silently.</p>
          </article>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold">Muslim Travel Listings</h2>
            <a className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`masjids halal restaurants ${city.name}`)}`}>
              Live map search
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard city={city} key={listing.slug} listing={listing} />
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
