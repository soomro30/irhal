"use client";

import {
  Baby,
  BusFront,
  CarFront,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FerrisWheel,
  Globe2,
  History,
  Hotel,
  type LucideIcon,
  MapPin,
  MoonStar,
  Route,
  ShoppingBag,
  Thermometer,
  TreePalm,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

const iconMap: Record<string, LucideIcon> = {
  baby: Baby,
  ferris: FerrisWheel,
  history: History,
  hotel: Hotel,
  moon: MoonStar,
  palm: TreePalm,
  pin: MapPin,
  route: Route,
  shopping: ShoppingBag,
  utensils: Utensils,
};

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
  if (iconKey === "city-info") {
    return (
      <span
        aria-hidden="true"
        className="grid h-11 w-16 grid-cols-3 place-items-center"
      >
        <DollarSign className="h-8 w-6 stroke-[1.8]" />
        <Thermometer className="h-9 w-6 stroke-[1.8]" />
        <Globe2 className="h-8 w-7 stroke-[1.8]" />
      </span>
    );
  }

  if (iconKey === "transport") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 items-end justify-center gap-1"
      >
        <CarFront className="h-8 w-8 fill-white stroke-[1.45]" />
        <BusFront className="h-11 w-10 fill-white stroke-[1.45]" />
      </span>
    );
  }

  if (iconKey === "halal") {
    return (
      <span
        aria-hidden="true"
        className="flex h-11 items-center justify-center text-[34px] font-black leading-none"
        lang="ar"
      >
        حلال
      </span>
    );
  }

  if (iconKey === "masjid") {
    return (
      <span
        aria-hidden="true"
        className="relative flex h-11 w-16 items-end justify-center"
      >
        <span className="absolute bottom-0 left-2 h-9 w-2 rounded-t-full bg-white" />
        <span className="absolute bottom-9 left-[11px] h-1.5 w-1.5 rounded-full bg-white" />
        <span className="absolute bottom-[42px] left-[13px] h-2 w-px bg-white" />
        <span className="absolute bottom-0 left-[25px] h-8 w-9 rounded-t-full bg-white" />
        <span className="absolute bottom-0 left-[22px] h-3.5 w-[44px] rounded-t-sm bg-white" />
        <span className="absolute bottom-9 left-[46px] h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    );
  }

  const Icon = iconMap[iconKey];
  if (!Icon) return null;
  return (
    <Icon aria-hidden="true" className="h-11 w-11 stroke-[1.6]" strokeWidth={1.6} />
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
  eyebrow: string;
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
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:px-12" dir={dir}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-irhal-red">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-ink md:text-4xl">
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
        className="mt-7 flex snap-x gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        ref={scrollerRef}
      >
        {items.map((item) => {
          const tileClassName = `group relative flex h-[120px] w-[120px] shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-md border-0 px-1 pb-2 pt-1 text-center font-sans text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.tone}`;
          const content = (
            <>
              <span className="absolute top-1.5 rounded-full bg-black/30 px-1 py-0.5 text-[9px] font-black leading-none text-white shadow-sm ltr:right-1.5 rtl:left-1.5">
                {item.countLabel ?? item.count}
              </span>
              <ExploreIcon iconKey={item.iconKey} />
              <span className="text-[11px] font-bold capitalize leading-tight">
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
