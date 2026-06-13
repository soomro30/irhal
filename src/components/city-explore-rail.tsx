"use client";

import {
  Baby,
  BusFront,
  ChevronLeft,
  ChevronRight,
  FerrisWheel,
  History,
  Hotel,
  Info,
  Landmark,
  type LucideIcon,
  MapPin,
  MoonStar,
  Route,
  ShoppingBag,
  TreePalm,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  baby: Baby,
  "city-info": Info,
  ferris: FerrisWheel,
  halal: Utensils,
  history: History,
  hotel: Hotel,
  masjid: Landmark,
  moon: MoonStar,
  palm: TreePalm,
  pin: MapPin,
  route: Route,
  shopping: ShoppingBag,
  transport: BusFront,
  utensils: Utensils,
};

const darkForegroundToneClassNames = new Set([
  "bg-[#ff6b00]",
  "bg-[#f5a800]",
  "bg-[#ffdd00]",
  "bg-[#ed5b96]",
  "bg-[#25a9dd]",
  "bg-[#00a3a3]",
  "bg-[#35aa32]",
  "bg-[#95c915]",
]);

export type CityExploreItem = {
  title: string;
  href: string;
  tone: string;
  iconKey: string;
  count?: number;
  countLabel?: string;
  external?: boolean;
};

function ExploreIcon({ iconKey }: { iconKey: string }) {
  const Icon = iconMap[iconKey];
  if (!Icon) return null;
  return (
    <Icon
      aria-hidden="true"
      className="h-11 w-11 stroke-[1.8]"
      strokeWidth={1.8}
    />
  );
}

export function CityExploreRail({
  dir = "ltr",
  eyebrow,
  items,
  labels,
  title,
}: {
  dir?: "ltr" | "rtl";
  eyebrow?: string;
  items: CityExploreItem[];
  labels: { next: string; previous: string };
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
          0.82,
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
  }, [updateScrollState]);

  return (
    <div className="mx-auto max-w-7xl px-6 pb-7 pt-1 sm:px-8 lg:px-12" dir={dir}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className={
              eyebrow
                ? "mt-1.5 text-2xl font-black tracking-tight text-ink md:text-3xl"
                : "text-2xl font-black tracking-tight text-ink md:text-3xl"
            }
          >
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-2" dir={dir}>
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
        className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollerRef}
      >
        {items.map((item) => {
          const foregroundClassName = darkForegroundToneClassNames.has(item.tone)
            ? "text-ink"
            : "text-white";
          const tileClassName = [
            "group relative flex h-24 w-24 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-lg px-1.5 pb-2 pt-5 text-center font-sans shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2",
            item.tone,
            foregroundClassName,
          ].join(" ");
          const content = (
            <>
              <span className="absolute top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white/90 px-1.5 text-[10px] font-black leading-none text-ink shadow-sm ltr:right-1.5 rtl:left-1.5">
                {item.countLabel ?? item.count}
              </span>
              <ExploreIcon iconKey={item.iconKey} />
              <span
                className={`flex min-h-7 items-center text-[10px] font-black capitalize leading-tight ${foregroundClassName}`}
              >
                {item.title}
              </span>
            </>
          );

          if (item.external) {
            return (
              <a className={tileClassName} href={item.href} key={item.title}>
                {content}
              </a>
            );
          }

          return (
            <Link className={tileClassName} href={item.href} key={item.title}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
