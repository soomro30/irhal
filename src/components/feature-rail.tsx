"use client";

import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoverLink, MapActionLink } from "@/components/discover-action";
import { cn } from "@/lib/utils";

export type FeatureCardData = {
  key: string;
  href: string;
  image: string;
  imageAlt: string;
  objectPosition?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  discoverLabel: string;
  eager?: boolean;
  mapHref?: string;
  mapLabel?: string;
};

type RailLabels = {
  previous: string;
  next: string;
};

// GetYourGuide-style card: bordered container, image with overlay eyebrow + heart,
// dense readable title and description, Discover pill at bottom.
export function FeatureCard({
  card,
  className,
}: {
  card: FeatureCardData;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-ink/10 bg-white transition duration-300 hover:border-ink/25 hover:shadow-[0_18px_45px_rgba(17,17,17,0.10)]",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
        <Link
          aria-label={card.title}
          className="absolute inset-0"
          href={card.href}
        >
          <Image
            alt={card.imageAlt}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            loading={card.eager ? "eager" : "lazy"}
            quality={90}
            sizes="(min-width: 1280px) 760px, (min-width: 640px) 72vw, 100vw"
            src={card.image}
            style={{ objectPosition: card.objectPosition ?? "center" }}
          />
        </Link>
        {card.eyebrow ? (
          <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-md bg-ink/85 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-sm rtl:left-auto rtl:right-3">
            {card.eyebrow}
          </span>
        ) : null}
        <span
          aria-hidden="true"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-ink shadow-sm transition group-hover:text-irhal-red rtl:left-3 rtl:right-auto"
        >
          <Heart className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-[0.005em] text-ink transition group-hover:text-irhal-red">
          <Link href={card.href}>{card.title}</Link>
        </h3>
        {card.description ? (
          <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.45] text-ink/85">
            {card.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <DiscoverLink href={card.href} label={card.discoverLabel} />
          {card.mapHref ? (
            <MapActionLink
              className="ms-auto"
              href={card.mapHref}
              label={card.mapLabel ?? "Open in Google Maps"}
            />
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FeatureRail({
  actionHref,
  actionLabel,
  dir = "ltr",
  items,
  labels = { previous: "Previous", next: "Next" },
  subtitle,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  dir?: "ltr" | "rtl";
  items: FeatureCardData[];
  labels?: RailLabels;
  subtitle?: string;
  title: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  const updateScrollState = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
    if (dir === "rtl") {
      setCanScrollPrev(scroller.scrollLeft < -4);
      setCanScrollNext(Math.abs(scroller.scrollLeft) < maxScrollLeft - 4);
      return;
    }
    setCanScrollPrev(scroller.scrollLeft > 4);
    setCanScrollNext(scroller.scrollLeft < maxScrollLeft - 4);
  }, [dir]);

  const scrollByPage = useCallback(
    (direction: "next" | "prev") => {
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const directionMultiplier = dir === "rtl" ? -1 : 1;
      scroller.scrollBy({
        behavior: "smooth",
        left:
          directionMultiplier *
          (direction === "next" ? 1 : -1) *
          scroller.clientWidth *
          0.85,
      });
    },
    [dir],
  );

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    updateScrollState();
    scroller.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      scroller.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items.length]);

  const arrowClass =
    "grid h-10 w-10 place-items-center rounded-full border border-ink/20 text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30";

  return (
    <section className="border-t border-ink/10 bg-white py-12 md:py-14" dir={dir}>
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-black tracking-tight text-ink md:text-3xl">
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-ink/65 md:text-base md:leading-7">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {actionHref && actionLabel ? (
              <Link
                className="inline-flex items-center rounded-full border border-irhal-red px-5 py-2 text-sm font-bold text-irhal-red transition hover:bg-irhal-red hover:text-white"
                href={actionHref}
              >
                {actionLabel}
              </Link>
            ) : null}
            <div className="flex items-center gap-2">
              <button
                aria-label={labels.previous}
                className={arrowClass}
                disabled={!canScrollPrev}
                onClick={() => scrollByPage("prev")}
                type="button"
              >
                <PreviousIcon aria-hidden="true" className="h-5 w-5" />
              </button>
              <button
                aria-label={labels.next}
                className={arrowClass}
                disabled={!canScrollNext}
                onClick={() => scrollByPage("next")}
                type="button"
              >
                <NextIcon aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          className="mt-8 flex snap-x gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={scrollerRef}
        >
          {items.map((card) => (
            <FeatureCard
              card={card}
              className="w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
              key={card.key}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
