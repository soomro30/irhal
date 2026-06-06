import Image from "next/image";
import Link from "next/link";

import { DiscoverPill } from "@/components/discover-action";
import type { CityGuide } from "@/lib/city-data";
import {
  getLocalizedGuideSectionCopy,
  itineraryGuideSectionSlug,
  publicSectionCards,
} from "@/lib/guide-items";

const imageBySection: Record<string, string> = {
  "festivals-and-annual-events": "/images/karachi-guide/festival.svg",
  "transportation-and-getting-around": "/images/karachi-guide/tour.svg",
  "neighborhood-operating-guide": "/images/karachi-guide/place.svg",
  hotels: "/images/karachi-guide/hotel.svg",
  "places-to-visit": "/images/karachi-guide/place.svg",
  shopping: "/images/karachi-guide/shopping.svg",
  "food-and-restaurants": "/images/karachi-guide/restaurant.svg",
  "organized-tours": "/images/karachi-guide/tour.svg",
  "children-in-tow": "/images/karachi-guide/family.svg",
  "muslim-visitor-information": "/images/karachi-guide/masjid.svg",
  "city-in-a-day-and-longer-itineraries": "/images/karachi-guide/tour.svg",
};

export const sectionImage = (slug: string) =>
  imageBySection[slug] ?? "/images/karachi-guide/place.svg";

export function GuideSectionGrid({
  city,
  cityName = city.name,
  excludeSlugs = [],
  locale = "en",
}: {
  city: CityGuide;
  cityName?: string;
  excludeSlugs?: string[];
  locale?: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const basePath = isArabic ? `/ar/city/${city.slug}` : `/en/city/${city.slug}`;
  const excluded = new Set(excludeSlugs);
  const cards = publicSectionCards.filter((card) => !excluded.has(card.slug));

  return (
    <section className="border-t border-ink/10 bg-white py-10" dir={isArabic ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
              {isArabic ? "ملف المدينة من إرحل" : "The Irhal city file"}
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-travel-navy">
              {isArabic
                ? `أقسام دليل ${cityName}`
                : `${city.name} travel guide sections`}
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-travel-navy/65">
            {isArabic
              ? "أقسام مركزة للمقالات، الأدلة، الخرائط، وتخطيط الرحلة."
              : "Focused sections for articles, directories, maps, and trip planning."}
          </p>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const sectionCopy = getLocalizedGuideSectionCopy(
              city,
              card.slug,
              locale,
            );
            const href =
              card.slug === itineraryGuideSectionSlug
                ? `${basePath}/itineraries`
                : `${basePath}/section/${card.slug}`;

            return (
            <Link
              className="group block rounded-lg border border-ink/10 bg-white shadow-none hover:border-coastal/40"
              href={href}
              key={card.slug}
            >
              <div className="relative h-32 overflow-hidden rounded-t-lg bg-neutral-100">
                <Image
                  alt={`${sectionCopy.title} guide section for ${cityName}`}
                  className="object-cover"
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  src={sectionImage(card.slug)}
                />
              </div>
              <div className="flex min-h-[188px] flex-col p-4">
                <h3 className="text-base font-bold leading-6 text-travel-navy">
                  {sectionCopy.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-travel-navy/65">
                  {sectionCopy.summary}
                </p>
                <div className="mt-auto pt-5">
                  <DiscoverPill label={isArabic ? "اكتشف" : "Discover"} />
                </div>
              </div>
            </Link>
          );
          })}
        </div>
      </div>
    </section>
  );
}
