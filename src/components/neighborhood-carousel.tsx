"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { DiscoverPill } from "@/components/discover-action";
import { Button } from "@/components/ui/button";

export type NeighborhoodCarouselItem = {
  description: string;
  external: boolean;
  href: string;
  image?: string;
  imageAlt?: string;
  name: string;
  objectPosition?: string;
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
          className="mt-8 flex snap-x gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={scrollerRef}
        >
          {items.map((item, index) => (
            <Link
              aria-label={
                dir === "rtl"
                  ? `${item.name} في ${cityName}`
                  : `${item.name} area guide in ${cityName}`
              }
              className="group block w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
              href={item.href}
              key={item.slug}
            >
              <div className="relative flex aspect-[4/3] items-end overflow-hidden rounded-lg bg-gradient-to-br from-[#16325c] to-coastal p-4 text-white shadow-sm transition duration-300 group-hover:shadow-[0_14px_38px_rgba(17,17,17,0.10)]">
                {item.image ? (
                  <>
                    <Image
                      alt={item.imageAlt ?? ""}
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      fill
                      sizes="(min-width: 1280px) 720px, (min-width: 768px) 60vw, 100vw"
                      src={item.image}
                      style={{
                        objectPosition: item.objectPosition ?? "center",
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/18 to-black/5" />
                  </>
                ) : null}
                <span className="absolute top-3 text-6xl font-black leading-none text-white/15 ltr:right-4 rtl:left-4">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="relative text-xs font-black uppercase tracking-[0.18em] text-white/85">
                  {dir === "rtl" ? "دليل منطقة" : "Area guide"}
                </p>
              </div>
              <h3 className="mt-4 line-clamp-2 text-xl font-extrabold leading-snug text-travel-navy transition group-hover:text-irhal-red">
                {item.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
                {item.description}
              </p>
              <div className="mt-4">
                <DiscoverPill label={dir === "rtl" ? "اكتشف" : "Discover"} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
