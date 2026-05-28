import { Bot, Database, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { MapPanel } from "@/components/map-panel";
import { PageShell } from "@/components/page-shell";
import { cities } from "@/lib/city-data";

export default function Home() {
  const city = cities[0];

  return (
    <PageShell>
      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1fr_1.1fr]">
            <div className="flex flex-col justify-center py-8">
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Enterprise City Intelligence</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-slate-950 md:text-6xl">
                Map-first travel guides built for AI, SEO, and Muslim-friendly discovery.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
                This starter implements the Irhal V4 Karachi model as a structured city dataset, editorial guide, live map layer,
                CMS collection system, and JSON-first AI assistant foundation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link className="bg-slate-950 px-5 py-3 text-sm font-semibold text-white" href="/city/karachi">
                  Open Karachi Guide
                </Link>
                <Link className="border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-950" href="/admin">
                  Open CMS
                </Link>
              </div>
            </div>
            <MapPanel
              markers={[
                { label: "Karachi", latitude: city.latitude, longitude: city.longitude },
                ...city.neighborhoods.map((neighborhood) => ({
                  label: neighborhood.name,
                  latitude: neighborhood.latitude,
                  longitude: neighborhood.longitude,
                  tone: "green" as const,
                })),
              ]}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-5 py-8 md:grid-cols-4">
          {[
            { icon: MapPin, title: "Geo Mandatory", copy: "Every listing carries lat/lng, map URL, and neighborhood mapping." },
            { icon: Database, title: "Portable Data", copy: "Postgres, PostGIS, and pgvector are separated from vendor-specific assumptions." },
            { icon: Bot, title: "Agent Ready", copy: "AI tasks use JSON inputs and outputs with validation and editorial review." },
            { icon: ShieldCheck, title: "SEO Validated", copy: "SSR routes, canonical metadata, JSON-LD, and internal links are first-class." },
          ].map((item) => (
            <article className="border border-slate-200 bg-white p-5" key={item.title}>
              <item.icon aria-hidden="true" className="h-6 w-6 text-emerald-700" />
              <h2 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.copy}</p>
            </article>
          ))}
        </section>
      </main>
    </PageShell>
  );
}
