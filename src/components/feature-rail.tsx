"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoverPill } from "@/components/discover-action";
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
};

type RailLabels = {
  previous: string;
  next: string;
};

// Lonely-Planet-style card: image on top, small uppercase eyebrow, bold title,
// and an outlined "Discover" pill. No borders/shadows — clean and editorial.
export function FeatureCard({
  card,
  className,
}: {
  card: FeatureCardData;
  className?: string;
}) {
  return (
    <Link
      className={cn("group block", className)}
      href={card.href}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
        <Image
          alt={card.imageAlt}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          loading={card.eager ? "eager" : "lazy"}
          sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 85vw"
          src={card.image}
          style={{ objectPosition: card.objectPosition ?? "center" }}
        />
      </div>
      {card.eyebrow ? (
        <p className="mt-4 truncate text-xs font-bold uppercase tracking-[0.14em] text-ink/55">
          {card.eyebrow}
        </p>
      ) : null}
      <h3 className="mt-1.5 line-clamp-2 text-2xl font-extrabold leading-tight text-ink transition group-hover:text-irhal-red">
        {card.title}
      </h3>
      {card.description ? (
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
          {card.description}
        </p>
      ) : null}
      <div className="mt-4">
        <DiscoverPill label={card.discoverLabel} />
      </div>
    </Link>
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
    "grid h-10 w-10 place-items-center rounded-md border border-ink/20 text-ink transition hover:border-ink disabled:cursor-not-allowed disabled:border-ink/10 disabled:text-ink/30";

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
                className="text-xs font-black uppercase tracking-[0.14em] text-ink underline underline-offset-4 transition hover:text-irhal-red"
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
