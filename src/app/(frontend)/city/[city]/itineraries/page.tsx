import { Route } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { getCityBySlug } from "@/lib/city-data";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) return {};

  return pageMetadata({
    title: `${city.name} Itineraries`,
    description: `Route-aware ${city.name} itineraries using neighborhoods, verified places, halal restaurants, and masjid-aware planning.`,
    path: `/city/${city.slug}/itineraries`,
  });
}

export default async function ItinerariesPage({ params }: Props) {
  const { city: citySlug } = await params;
  const city = getCityBySlug(citySlug);
  if (!city) notFound();

  return (
    <PageShell>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: city.name, path: `/city/${city.slug}` },
            { name: "Itineraries", path: `/city/${city.slug}/itineraries` },
          ]),
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: city.itineraries.map((itinerary, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/city/${city.slug}/itineraries#${itinerary.slug}`),
              name: itinerary.title,
            })),
          },
        ]}
      />
      <main className="mx-auto max-w-7xl px-5 py-8">
        <Link className="text-sm font-semibold text-slate-600 hover:text-slate-950" href={`/city/${city.slug}`}>
          Back to {city.name}
        </Link>
        <div className="mt-5">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-700">
            <Route aria-hidden="true" className="h-4 w-4" />
            Route-aware plans
          </p>
          <h1 className="mt-3 text-4xl font-bold">{city.name} Itineraries</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Itineraries are generated from approved city data, neighborhood clusters, verified listing coordinates, and Muslim
            travel constraints.
          </p>
        </div>

        <section className="mt-8 grid gap-5">
          {city.itineraries.map((itinerary) => (
            <article className="border border-slate-200 bg-white p-6" id={itinerary.slug} key={itinerary.slug}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {itinerary.durationDays} day · {itinerary.audience}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">{itinerary.title}</h2>
                </div>
                <span className="bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">AI-ready JSON</span>
              </div>
              <p className="mt-4 text-slate-600">{itinerary.summary}</p>
              <div className="mt-5 grid gap-4">
                {itinerary.days.map((day) => (
                  <div className="border-l-2 border-slate-950 pl-4" key={day.dayNumber}>
                    <h3 className="font-semibold">
                      Day {day.dayNumber}: {day.theme}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{day.routeNotes}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {day.stops.map((stop) => (
                        <span className="bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700" key={stop}>
                          {stop}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
