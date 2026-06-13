import { Compass, MapPin, Route } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CityGuide } from "@/lib/city-data";
import {
  getLocalizedGuideSectionCopy,
  publicSectionCards,
} from "@/lib/guide-items";
import { cn } from "@/lib/utils";

export type SidebarRelatedItem = {
  title: string;
  category: string;
  href: string;
  image: string;
};

type SectionSidebarProps = {
  city: CityGuide;
  cityBasePath: string;
  cityName: string;
  currentSlug: string;
  locale?: "en" | "ar";
  mapUrl?: string;
  relatedItems?: SidebarRelatedItem[];
  relatedTitle?: string;
};

export function SectionSidebar({
  city,
  cityBasePath,
  cityName,
  currentSlug,
  locale = "en",
  mapUrl,
  relatedItems = [],
  relatedTitle,
}: SectionSidebarProps) {
  const isArabic = locale === "ar";
  const labels = isArabic
    ? {
        browse: "استكشف الدليل",
        itineraries: "عرض المسارات",
        map: "افتح خريطة المدينة",
        moreToExplore: "المزيد للاستكشاف",
        planBody: `ابنِ مسارك، واعثر على الطعام الحلال وأماكن الصلاة، ونظّم أيامك في ${cityName}.`,
        planTitle: "خطط رحلتك",
      }
    : {
        browse: "Explore the guide",
        itineraries: "View itineraries",
        map: "Open city map",
        moreToExplore: "More to explore",
        planBody: `Build a route, find halal food and prayer spots, and map your days in ${cityName}.`,
        planTitle: "Plan your trip",
      };

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <Card className="p-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
          {labels.browse}
        </p>
        <nav className="mt-3 flex flex-col">
          {publicSectionCards.map((sectionCard) => {
            const title = getLocalizedGuideSectionCopy(
              city,
              sectionCard.slug,
              locale,
            ).title;
            const active = sectionCard.slug === currentSlug;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-bold transition",
                  active
                    ? "bg-paper-deep text-irhal-red"
                    : "text-ink/70 hover:bg-paper-deep hover:text-irhal-red",
                )}
                href={`${cityBasePath}/section/${sectionCard.slug}`}
                key={sectionCard.slug}
              >
                {title}
              </Link>
            );
          })}
        </nav>
      </Card>

      {relatedItems.length > 0 ? (
        <Card className="p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
            {relatedTitle ?? labels.moreToExplore}
          </p>
          <ul className="mt-3 flex flex-col gap-1">
            {relatedItems.map((item) => (
              <li key={item.href}>
                <Link
                  className="group flex items-center gap-3 rounded-lg p-2 transition hover:bg-paper-deep"
                  href={item.href}
                >
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-paper-deep">
                    <Image
                      alt={item.title}
                      className="object-cover"
                      fill
                      sizes="160px"
                      src={item.image}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-travel-navy group-hover:text-irhal-red">
                      {item.title}
                    </span>
                    {item.category ? (
                      <span className="mt-0.5 block truncate text-xs font-bold uppercase tracking-wide text-coastal">
                        {item.category}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="border-0 bg-ink p-6 text-white">
        <Compass aria-hidden="true" className="h-6 w-6 text-irhal-orange" />
        <h3 className="mt-3 text-lg font-black">{labels.planTitle}</h3>
        <p className="mt-2 text-sm leading-6 text-white/75">{labels.planBody}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Button asChild size="sm" variant="orange">
            <Link href={`${cityBasePath}/itineraries`}>
              <Route aria-hidden="true" />
              {labels.itineraries}
            </Link>
          </Button>
          {mapUrl ? (
            <Button asChild size="sm" variant="quiet">
              <a href={mapUrl}>
                <MapPin aria-hidden="true" />
                {labels.map}
              </a>
            </Button>
          ) : null}
        </div>
      </Card>
    </aside>
  );
}
