import { ExternalLink, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { ListingCard } from "@/components/listing-card";
import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { getListingsByNeighborhood, getNeighborhood } from "@/lib/city-data";
import { getCityBySlug } from "@/lib/city-source";
import { breadcrumbJsonLd, neighborhoodJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; area: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, area } = await params;
  const city = await getCityBySlug(citySlug);
  const neighborhood = city ? getNeighborhood(city, area) : undefined;
  if (!city || !neighborhood) return {};

  return pageMetadata({
    title: `${neighborhood.name} ${city.name} Neighborhood Guide`,
    description: neighborhood.operatingGuide,
    path: `/city/${city.slug}/neighborhood/${neighborhood.slug}`,
  });
}

export default async function NeighborhoodPage({ params }: Props) {
  const { city: citySlug, area } = await params;
  const city = await getCityBySlug(citySlug);
  const neighborhood = city ? getNeighborhood(city, area) : undefined;
  if (!city || !neighborhood) notFound();

  const listings = getListingsByNeighborhood(city, neighborhood.slug);

  return (
    <PageShell>
      <JsonLd
        data={[
          neighborhoodJsonLd(city, neighborhood),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: city.name, path: `/city/${city.slug}` },
            { name: neighborhood.name, path: `/city/${city.slug}/neighborhood/${neighborhood.slug}` },
          ]),
        ]}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href={`/city/${city.slug}`}>
          Back to {city.name}
        </Link>
        <section className="mt-5 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{neighborhood.zone} cluster</p>
            <h1 className="mt-3 text-4xl font-bold">{neighborhood.name}</h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">{neighborhood.operatingGuide}</p>
            <a className="mt-6 inline-flex items-center gap-2 bg-slate-950 px-4 py-3 text-sm font-semibold text-white" href={neighborhood.mapUrl}>
              <MapPin aria-hidden="true" className="h-4 w-4" />
              Open area map
              <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
          <MapPanel
            markers={[
              { label: neighborhood.name, latitude: neighborhood.latitude, longitude: neighborhood.longitude },
              ...listings.map((listing) => ({
                label: listing.name,
                latitude: listing.latitude,
                longitude: listing.longitude,
                tone: listing.listingType === "masjid" ? ("gold" as const) : ("green" as const),
              })),
            ]}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-bold">Mapped Listings</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {listings.map((listing) => (
                <ListingCard city={city} key={listing.slug} listing={listing} />
              ))}
            </div>
          </div>
          <aside className="border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Live Map Locators</h2>
            <div className="mt-4 grid gap-3">
              {neighborhood.liveMapQueries.map((query) => (
                <a className="flex items-center justify-between gap-3 border border-slate-200 p-3 text-sm font-medium hover:border-slate-400" href={query.providerUrl} key={query.query}>
                  {query.label}
                  <ExternalLink aria-hidden="true" className="h-4 w-4" />
                </a>
              ))}
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
