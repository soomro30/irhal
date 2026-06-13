import Image from "next/image";
import Link from "next/link";

import { DiscoverPill } from "@/components/discover-action";
import type { CityGuide } from "@/lib/city-data";
import {
  getLocalizedGuideSectionCopy,
  itineraryGuideSectionSlug,
  publicSectionCards,
} from "@/lib/guide-items";
import {
  genericGuidePlaceholderImage,
  guidePlaceholderImageByKind,
} from "@/lib/image-placeholders";

const imageBySection: Record<string, string> = {
  "festivals-and-annual-events": guidePlaceholderImageByKind.festival,
  "transportation-and-getting-around": "/images/karachi-guide/transport.svg",
  "visitor-information": "/images/karachi-guide/visitor-info.svg",
  "city-information": "/images/karachi-guide/city-info.svg",
  "neighborhood-operating-guide": guidePlaceholderImageByKind.place,
  hotels: guidePlaceholderImageByKind.hotel,
  "places-to-visit": guidePlaceholderImageByKind.place,
  shopping: guidePlaceholderImageByKind.shopping,
  "food-and-restaurants": guidePlaceholderImageByKind.restaurant,
  "organized-tours": guidePlaceholderImageByKind.tour,
  "children-in-tow": guidePlaceholderImageByKind.family,
  "muslim-visitor-information": guidePlaceholderImageByKind.masjid,
  "city-in-a-day-and-longer-itineraries": guidePlaceholderImageByKind.tour,
};

export const sectionImage = (slug: string) =>
  imageBySection[slug] ?? genericGuidePlaceholderImage;

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
        <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
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
              <Link className="group block" href={href} key={card.slug}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-paper-deep shadow-sm transition duration-300 group-hover:shadow-[0_14px_38px_rgba(17,17,17,0.10)]">
                  <Image
                    alt={`${sectionCopy.title} guide section for ${cityName}`}
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fill
                    quality={90}
                    sizes="(min-width: 1280px) 760px, (min-width: 640px) 72vw, 100vw"
                    src={sectionImage(card.slug)}
                  />
                </div>
                <h3 className="mt-4 text-xl font-extrabold leading-snug text-travel-navy transition group-hover:text-irhal-red">
                  {sectionCopy.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-ink/70">
                  {sectionCopy.summary}
                </p>
                <div className="mt-4">
                  <DiscoverPill label={isArabic ? "اكتشف" : "Discover"} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
