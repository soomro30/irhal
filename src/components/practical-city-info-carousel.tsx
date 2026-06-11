"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CloudSun,
  CreditCard,
  Languages,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DiscoverPill } from "@/components/discover-action";

const icons = {
  calendar: CalendarDays,
  climate: CloudSun,
  emergency: PhoneCall,
  exchange: CreditCard,
  health: ShieldCheck,
  language: Languages,
};

export type PracticalInfoCard = {
  badge: string;
  body: string;
  detail: string;
  href: string;
  icon: keyof typeof icons;
  title: string;
};

export function PracticalCityInfoCarousel({
  cards,
  citySlug,
  dir = "ltr",
  labels = {
    action: "View visitor info",
    details: "Discover",
    eyebrow: "Practical city info",
    next: "Next practical info",
    previous: "Previous practical info",
    title: "Weather, Money, Safety and Basics",
  },
  pathPrefix = "",
}: {
  cards: PracticalInfoCard[];
  cityName?: string;
  citySlug: string;
  dir?: "ltr" | "rtl";
  labels?: {
    action: string;
    details: string;
    eyebrow: string;
    next: string;
    previous: string;
    title: string;
  };
  pathPrefix?: string;
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
            <h2 className="mt-2 text-3xl font-black tracking-tight text-travel-navy">
              {labels.title}
            </h2>
          </div>
          <div className="flex items-center gap-2" dir={dir}>
            <Button asChild className="hidden md:inline-flex" variant="outline">
              <Link href={`${pathPrefix}/city/${citySlug}/section/visitor-information`}>
                {labels.action}
              </Link>
            </Button>
            {cards.length > 4 ? (
              <>
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
              </>
            ) : null}
          </div>
        </div>

        <div
          className="mt-8 flex snap-x gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          ref={scrollerRef}
        >
          {cards.map((card) => {
            const Icon = icons[card.icon];

            return (
              <Link
                className="group block w-[82%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)] xl:w-[calc((100%-4.5rem)/4)]"
                href={card.href}
                key={card.title}
              >
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#e9f4f3]">
                  <div className="absolute left-3 top-3 rtl:left-auto rtl:right-3">
                    <Badge className="rounded-md bg-[#16325c] px-2.5 py-1 text-xs font-bold leading-none text-white shadow-sm">
                      {card.badge}
                    </Badge>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-coastal shadow-sm">
                    <Icon aria-hidden="true" className="h-10 w-10" />
                  </div>
                </div>
                <h3 className="mt-4 text-xl font-extrabold leading-snug text-travel-navy transition group-hover:text-irhal-red">
                  {card.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
                  {card.body}
                </p>
                {card.detail ? (
                  <p className="mt-2 line-clamp-2 text-xs font-bold leading-5 text-ink/55">
                    {card.detail}
                  </p>
                ) : null}
                <div className="mt-4">
                  <DiscoverPill label={labels.details} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
