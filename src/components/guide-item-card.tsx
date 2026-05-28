import { MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import type { CityGuide } from "@/lib/city-data";
import type { GuideItem } from "@/lib/guide-items";
import { pathForGuideItem } from "@/lib/guide-items";

export function GuideItemCard({ city, item }: { city: CityGuide; item: GuideItem }) {
  return (
    <article className="min-w-[280px] max-w-[360px] shrink-0">
      <Link href={pathForGuideItem(city, item)}>
        <Image
          alt={item.imageAlt}
          className="aspect-[1.35] w-full bg-slate-200 object-cover"
          height={267}
          src={item.imageUrl}
          width={360}
        />
      </Link>
      <p className="mt-4 font-mono text-xs uppercase tracking-wider text-slate-600">{item.eyebrow}</p>
      <h3 className="mt-3 text-2xl font-bold leading-tight text-slate-950">
        <Link className="hover:underline" href={pathForGuideItem(city, item)}>
          {item.title}
        </Link>
      </h3>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link
          className="inline-flex items-center rounded-full border border-slate-950 px-4 py-2 font-mono text-xs uppercase tracking-wider text-slate-950"
          href={pathForGuideItem(city, item)}
        >
          Discover
        </Link>
        {item.mapUrl ? (
          <a className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-950" href={item.mapUrl}>
            <MapPin aria-hidden="true" className="h-4 w-4" />
            Map
          </a>
        ) : null}
      </div>
    </article>
  );
}

export function GuideItemRail({
  city,
  items,
  title,
  subtitle,
  href,
  actionLabel = "Explore all",
}: {
  city: CityGuide;
  items: GuideItem[];
  title: string;
  subtitle: string;
  href: string;
  actionLabel?: string;
}) {
  return (
    <section className="overflow-hidden border-t border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex items-end justify-between gap-5">
          <div>
            <h2 className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">{title}</h2>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{subtitle}</p>
          </div>
          <Link className="hidden font-mono text-sm uppercase tracking-widest underline md:inline-flex" href={href}>
            {actionLabel}
          </Link>
        </div>
        <div className="mt-10 flex gap-8 overflow-x-auto pb-5">
          {items.map((item) => (
            <GuideItemCard city={city} item={item} key={item.id} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function GuideItemGrid({ city, items }: { city: CityGuide; items: GuideItem[] }) {
  return (
    <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <GuideItemCard city={city} item={item} key={item.id} />
      ))}
    </div>
  );
}
