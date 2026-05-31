"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoverPill } from "@/components/discover-action";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type NeighborhoodCarouselItem = {
  description: string;
  external: boolean;
  href: string;
  name: string;
  slug: string;
};

export function NeighborhoodCarousel({
  cityName,
  dir = "ltr",
  items,
  labels = {
    areas: "areas",
    eyebrow: "Area guide",
    next: "Next neighbourhoods",
    previous: "Previous neighbourhoods",
    title: "Neighbourhoods",
  },
}: {
  cityName: string;
  dir?: "ltr" | "rtl";
  items: NeighborhoodCarouselItem[];
  labels?: {
    areas: string;
    eyebrow: string;
    next: string;
    previous: string;
    title: string;
  };
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

  const scrollByPage = useCallback((direction: "next" | "prev") => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const directionMultiplier = dir === "rtl" ? -1 : 1;

    scroller.scrollBy({
      behavior: "smooth",
      left:
        directionMultiplier *
        (direction === "next" ? 1 : -1) *
        scroller.clientWidth *
        0.82,
    });
  }, [dir]);

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
  }, [updateScrollState]);

  return (
    <section className="border-t border-ink/10 bg-white py-12" dir={dir}>
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
              {labels.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
              {labels.title}
            </h2>
          </div>
          <div className="flex items-center gap-2" dir={dir}>
            <span className="mr-2 hidden rounded-full border border-ink/10 px-3 py-1 text-xs font-bold text-ink/55 sm:inline-flex">
              {items.length} {labels.areas}
            </span>
            <Button
              aria-label={labels.previous}
              disabled={!canScrollPrev}
              onClick={() => scrollByPage("prev")}
              size="icon"
              type="button"
              variant="outline"
            >
              <PreviousIcon aria-hidden="true" />
            </Button>
            <Button
              aria-label={labels.next}
              disabled={!canScrollNext}
              onClick={() => scrollByPage("next")}
              size="icon"
              type="button"
              variant="outline"
            >
              <NextIcon aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div
          className="mt-7 flex snap-x gap-5 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={scrollerRef}
        >
          {items.map((item, index) => (
            <Card
              className="w-[282px] shrink-0 snap-start overflow-hidden rounded-lg border-ink/10 bg-white shadow-none transition hover:border-coastal/40"
              key={item.slug}
            >
              <Link
                aria-label={
                  dir === "rtl"
                    ? `${item.name} في ${cityName}`
                    : `${item.name} area guide in ${cityName}`
                }
                className="group block h-full"
                href={item.href}
              >
                <div className="flex min-h-[226px] flex-col p-4">
                  <p className="text-sm font-bold leading-5 text-travel-navy/65">
                    {cityName}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-6 text-travel-navy">
                    {item.name}
                  </h3>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-coastal">
                    {dir === "rtl"
                      ? `دليل منطقة ${String(index + 1).padStart(2, "0")}`
                      : `Area guide ${String(index + 1).padStart(2, "0")}`}
                  </p>
                  <p className="mt-1.5 line-clamp-4 text-sm leading-6 text-travel-navy/80">
                    {item.description}
                  </p>
                  <div className="mt-auto pt-5">
                    <DiscoverPill label={dir === "rtl" ? "اكتشف" : "Discover"} />
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
