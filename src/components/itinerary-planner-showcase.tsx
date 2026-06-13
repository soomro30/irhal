import { ArrowUpRight, CalendarDays, Route, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ItineraryShowcaseItem = {
  key: string;
  href: string;
  image: string;
  imageAlt: string;
  title: string;
  summary: string;
  audience: string;
  durationLabel: string;
  stopCountLabel: string;
  routeNote?: string;
  chips: string[];
  stopLabels: string[];
};

type ItineraryPlannerShowcaseLabels = {
  action: string;
  alternateRoutes: string;
  badge: string;
  featured: string;
  map: string;
  open: string;
  routePreview: string;
};

export function ItineraryPlannerShowcase({
  actionHref,
  dir = "ltr",
  items,
  labels,
  subtitle,
  title,
}: {
  actionHref: string;
  dir?: "ltr" | "rtl";
  items: ItineraryShowcaseItem[];
  labels: ItineraryPlannerShowcaseLabels;
  subtitle?: string;
  title: string;
}) {
  const featured = items[0];
  if (!featured) return null;

  const isRtl = dir === "rtl";
  const alternateRoutes = items.slice(1, 4);
  // Drop stops that resolved to the "pending translation" placeholder so the
  // Arabic route never leaks CMS-missing copy (e.g. "معلم قيد الترجمة").
  const featuredStops = featured.stopLabels
    .filter((stop) => stop && !stop.includes("قيد الترجمة"))
    .slice(0, 6);
  const chips = Array.from(
    new Set([featured.audience, ...featured.chips].filter(Boolean)),
  ).slice(0, 3);
  const routeHeading = isRtl ? "محطات المسار" : "On this route";

  return (
    <section
      className="border-y border-ink/10 bg-white py-12 md:py-14"
      dir={dir}
    >
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <Badge variant="green">{labels.badge}</Badge>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-ink md:text-3xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-ink/65 md:text-base md:leading-7">
                {subtitle}
              </p>
            ) : null}
          </div>
          <Button asChild variant="outline">
            <Link href={actionHref}>
              {labels.action}
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          {/* Featured route — horizontal card: image beside content, compact route pills */}
          <article className="grid overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-[0_18px_55px_rgba(17,17,17,0.06)] sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
            <div className="relative aspect-[16/11] overflow-hidden bg-paper-deep sm:aspect-auto sm:min-h-full">
              <Image
                alt={featured.imageAlt}
                className="object-cover object-center"
                fill
                quality={90}
                sizes="(min-width: 1024px) 50vw, 100vw"
                src={featured.image}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-ink shadow-sm backdrop-blur-sm rtl:left-auto rtl:right-3">
                <Sparkles aria-hidden="true" className="h-3 w-3 text-irhal-red" />
                {labels.featured}
              </span>
            </div>

            <div className="flex flex-col p-5 sm:p-6">
              <h3 className="text-xl font-black leading-tight text-ink md:text-2xl">
                {featured.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink/60">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 text-irhal-green" />
                  {featured.durationLabel}
                </span>
                <span aria-hidden="true" className="text-ink/25">
                  •
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Route aria-hidden="true" className="h-3.5 w-3.5 text-irhal-green" />
                  {featured.stopCountLabel}
                </span>
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-6 text-ink/70">
                {featured.summary}
              </p>

              {chips.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {chips.map((chip) => (
                    <span
                      className="rounded-full border border-ink/12 bg-paper-deep px-2.5 py-0.5 text-[11px] font-bold text-ink/70"
                      key={chip}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              ) : null}

              {featuredStops.length > 0 ? (
                <div className="mt-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-ink/45">
                    {routeHeading}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {featuredStops.map((stop, index) => (
                      <span
                        className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-ink/10 bg-white py-1 pe-2.5 ps-1 text-xs font-bold text-ink shadow-sm sm:max-w-[18rem]"
                        key={`${stop}-${index}`}
                      >
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-irhal-green text-[10px] font-black text-white">
                          {index + 1}
                        </span>
                        <span className="truncate">{stop}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <Button asChild className="mt-5 w-full sm:w-fit" variant="green">
                <Link href={featured.href}>
                  {labels.open}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </article>

          {/* More route ideas — compact alternate cards */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/50">
              {labels.alternateRoutes}
            </p>
            {alternateRoutes.map((item) => (
              <Link
                className="group grid grid-cols-[120px_minmax(0,1fr)] gap-3.5 rounded-xl border border-ink/10 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-[0_18px_45px_rgba(17,17,17,0.10)]"
                href={item.href}
                key={item.key}
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-deep">
                  <Image
                    alt={item.imageAlt}
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fill
                    quality={90}
                    sizes="240px"
                    src={item.image}
                  />
                </div>
                <div className="min-w-0 self-center py-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-ink/45">
                    {labels.routePreview}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-base font-black leading-tight text-ink transition group-hover:text-irhal-red">
                    {item.title}
                  </h3>
                  <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-ink/55">
                    <span>{item.durationLabel}</span>
                    <span aria-hidden="true" className="text-ink/25">
                      •
                    </span>
                    <span>{item.stopCountLabel}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
