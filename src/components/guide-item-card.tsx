import { Heart, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiscoverLink } from "@/components/discover-action";
import { FeatureRail, type FeatureCardData } from "@/components/feature-rail";
import type { CityGuide } from "@/lib/city-data";
import { getGuideItemImage } from "@/lib/city-presentation";
import type { GuideItem } from "@/lib/guide-items";
import { pathForGuideItem } from "@/lib/guide-items";
import { cn } from "@/lib/utils";

type GuideItemLabels = {
  discover: string;
  map: string;
  savePrefix: string;
  verified: string;
};

const defaultGuideItemLabels: GuideItemLabels = {
  discover: "Discover",
  map: "Map",
  savePrefix: "Save",
  verified: "Verified",
};

// Convert vague price-tier words (e.g. "Expensive", "Budget") into clear price
// symbols so a bare "EXPENSIVE" label no longer reads as a confusing category.
const formatMetaValue = (value: string) => {
  const normalized = value.toLowerCase();
  if (/luxury|premium|upscale|five[ -]?star|5[ -]?star/.test(normalized))
    return "$$$$";
  if (/expensive/.test(normalized)) return "$$$";
  if (/moderate|mid[ -]?range/.test(normalized)) return "$$";
  if (/budget|cheap|economy|inexpensive/.test(normalized)) return "$";
  return value;
};

export function GuideItemCard({
  city,
  cityName = city.name,
  item,
  labels = defaultGuideItemLabels,
  layout = "grid",
  pathPrefix = "",
}: {
  city: CityGuide;
  cityName?: string;
  item: GuideItem;
  labels?: GuideItemLabels;
  layout?: "grid" | "rail";
  pathPrefix?: string;
}) {
  const itemPath = `${pathPrefix}${pathForGuideItem(city, item)}`;
  const visual = getGuideItemImage(item);
  const metaParts = [item.category, item.budget]
    .map((value) => value?.trim())
    .filter(
      (value): value is string => Boolean(value) && value !== item.title,
    )
    .map(formatMetaValue);
  const meta = Array.from(new Set(metaParts)).join(" · ");

  return (
    <Card
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-lg border-ink/10 bg-white shadow-none",
        layout === "rail" ? "w-[282px] shrink-0" : "w-full",
      )}
    >
      <div className="relative h-[174px] overflow-hidden bg-paper-deep">
        <Link className="absolute inset-0" href={itemPath}>
          <Image
            alt={item.imageAlt}
            className="object-cover"
            fill
            sizes={
              layout === "rail"
                ? "282px"
                : "(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            }
            src={visual.image}
            style={{ objectPosition: visual.objectPosition }}
          />
        </Link>
        <Badge
          className="absolute left-3 top-3 w-fit max-w-[185px] overflow-hidden text-ellipsis rounded-md border-transparent bg-[#16325c] px-2.5 py-1 text-xs font-bold leading-none text-white shadow-sm rtl:left-auto rtl:right-3"
          title={item.eyebrow}
        >
          {item.eyebrow}
        </Badge>
        <Button
          aria-label={`${labels.savePrefix} ${item.title}`}
          className="absolute right-3 top-3 h-9 w-9 rounded-full border-white bg-white/95 text-travel-navy shadow-sm hover:bg-white rtl:left-3 rtl:right-auto"
          size="icon"
          type="button"
          variant="outline"
        >
          <Heart aria-hidden="true" className="h-5 w-5" />
        </Button>
      </div>
      <CardContent className="flex flex-1 flex-col p-4">
        <p className="text-sm font-bold leading-5 text-travel-navy/65">
          {cityName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-6 text-travel-navy">
          <Link className="hover:underline" href={itemPath}>
            {item.title}
          </Link>
        </h3>
        {meta ? (
          <p className="mt-1.5 text-xs font-bold uppercase tracking-wide text-coastal">
            {meta}
          </p>
        ) : null}
        <p className="mt-1.5 line-clamp-4 text-sm leading-6 text-travel-navy/80">
          {item.originalContent?.[0] ?? item.description}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
          <DiscoverLink href={itemPath} label={labels.discover} />
          <div className="ms-auto flex items-center gap-3">
            {item.geoStatus === "verified" ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-travel-navy">
                <ShieldCheck aria-hidden="true" className="h-4 w-4 text-coastal" />
                {labels.verified}
              </div>
            ) : null}
            {item.mapUrl ? (
              <a
                className="inline-flex items-center gap-1 text-sm font-bold text-coastal hover:text-travel-navy"
                href={item.mapUrl}
              >
                <MapPin aria-hidden="true" className="h-4 w-4" />
                {labels.map}
              </a>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GuideItemRail({
  actionLabel = "Explore all",
  city,
  dir = "ltr",
  items,
  href,
  labels = defaultGuideItemLabels,
  pathPrefix = "",
  subtitle,
  title,
}: {
  actionLabel?: string;
  city: CityGuide;
  cityName?: string;
  dir?: "ltr" | "rtl";
  items: GuideItem[];
  href: string;
  labels?: GuideItemLabels;
  pathPrefix?: string;
  subtitle: string;
  title: string;
}) {
  const navLabels =
    dir === "rtl"
      ? { previous: "السابق", next: "التالي" }
      : { previous: "Previous", next: "Next" };

  const cards: FeatureCardData[] = items.map((item, index) => {
    const visual = getGuideItemImage(item);
    return {
      key: item.id,
      href: `${pathPrefix}${pathForGuideItem(city, item)}`,
      image: visual.image,
      imageAlt: item.imageAlt,
      objectPosition: visual.objectPosition,
      eyebrow: item.eyebrow,
      title: item.title,
      discoverLabel: labels.discover,
      eager: index < 4,
    };
  });

  return (
    <FeatureRail
      actionHref={href}
      actionLabel={actionLabel}
      dir={dir}
      items={cards}
      labels={navLabels}
      subtitle={subtitle}
      title={title}
    />
  );
}

export function GuideItemGrid({
  city,
  cityName = city.name,
  items,
  labels,
  pathPrefix = "",
}: {
  city: CityGuide;
  cityName?: string;
  items: GuideItem[];
  labels?: GuideItemLabels;
  pathPrefix?: string;
}) {
  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <GuideItemCard
          city={city}
          cityName={cityName}
          item={item}
          key={item.id}
          labels={labels}
          pathPrefix={pathPrefix}
        />
      ))}
    </div>
  );
}
