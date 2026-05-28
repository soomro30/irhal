import { ExternalLink, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CityGuide } from "@/lib/city-data";
import type { GuideItem } from "@/lib/guide-items";
import { sectionCards } from "@/lib/guide-items";
import { JsonLd } from "./json-ld";
import { PageShell } from "./page-shell";
import { breadcrumbJsonLd } from "@/lib/seo";

export function GuideItemDetail({ city, item }: { city: CityGuide; item: GuideItem }) {
  const section = sectionCards.find((sectionCard) => sectionCard.slug === item.sectionSlug);
  const detailEntries = Object.entries(item.details).filter(([key, value]) => key !== "map" && Boolean(value));

  return (
    <PageShell>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: city.name, path: `/city/${city.slug}` },
          { name: section?.title ?? item.sectionSlug, path: `/city/${city.slug}/section/${item.sectionSlug}` },
          { name: item.title, path: `/city/${city.slug}/${item.kind}/${item.slug}` },
        ])}
      />
      <main>
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <Link
                className="font-mono text-sm uppercase tracking-widest text-slate-600 hover:text-slate-950"
                href={`/city/${city.slug}/section/${item.sectionSlug}`}
              >
                Back to {section?.title ?? "section"}
              </Link>
              <p className="mt-10 font-mono text-sm uppercase tracking-widest text-emerald-700">{item.eyebrow}</p>
              <h1 className="mt-4 text-5xl font-bold tracking-tight text-slate-950 md:text-6xl">{item.title}</h1>
              <p className="mt-6 text-xl leading-9 text-slate-600">{item.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                {item.mapUrl ? (
                  <a className="inline-flex items-center gap-2 bg-slate-950 px-5 py-3 font-semibold text-white" href={item.mapUrl}>
                    <MapPin aria-hidden="true" className="h-4 w-4" />
                    Open map
                    <ExternalLink aria-hidden="true" className="h-4 w-4" />
                  </a>
                ) : null}
                <span className="border border-slate-300 px-5 py-3 font-mono text-sm uppercase tracking-widest">
                  {item.geoStatus.replace(/-/g, " ")}
                </span>
              </div>
            </div>
            <Image
              alt={item.imageAlt}
              className="aspect-[1.35] w-full bg-slate-200 object-cover"
              height={620}
              priority
              src={item.imageUrl}
              width={837}
            />
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-12">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 lg:grid-cols-[1fr_0.7fr]">
            <article className="bg-white p-6">
              <h2 className="text-3xl font-bold">CMS document fields</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {detailEntries.map(([key, value]) => (
                  <div className="border-t border-slate-200 pt-4" key={key}>
                    <p className="font-mono text-xs uppercase tracking-widest text-slate-500">{key.replace(/_/g, " ")}</p>
                    <p className="mt-2 text-base leading-7 text-slate-800">{value}</p>
                  </div>
                ))}
              </div>
            </article>
            <aside className="bg-white p-6">
              <h2 className="text-2xl font-bold">Publishing status</h2>
              <div className="mt-6 space-y-4 text-sm leading-6 text-slate-700">
                <p>
                  This imported record is a separate city-guide item and should be managed as its own Payload CMS document.
                </p>
                <p>
                  Before promoting to a canonical map listing, enrich it with provider place ID, exact coordinates, verified
                  image/media, source logs, and SEO fields.
                </p>
                <p className="font-mono text-xs uppercase tracking-widest text-slate-500">Source table: {item.sourceTable}</p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
