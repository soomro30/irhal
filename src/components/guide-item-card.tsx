import { Heart, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiscoverLink } from "@/components/discover-action";
import { FeatureRail, type FeatureCardData } from "@/components/feature-rail";
import type { CityGuide } from "@/lib/city-data";
import { getGuideItemImage, hasGuideItemMedia } from "@/lib/city-presentation";
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

export type GuideCardSortMode =
  | "media"
  | "more-description"
  | "recent-update"
  | "name";

const guideItemCardDescription = (item: GuideItem) =>
  item.originalContent?.find((entry) => entry.trim()) ?? item.description;

const descriptionScore = (item: GuideItem) =>
  guideItemCardDescription(item).trim().length;

const timestampScore = (item: GuideItem) => {
  const raw = item.updatedAt ?? item.createdAt;
  const value = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(value) ? 0 : value;
};

const createdAtScore = (item: GuideItem) => {
  const value = item.createdAt ? Date.parse(item.createdAt) : Number.NaN;
  return Number.isNaN(value) ? 0 : value;
};

export const sortGuideItemsForCards = (
  items: GuideItem[],
  sortMode: GuideCardSortMode = "media",
) =>
  items
    .map((item, index) => ({ index, item }))
    .sort((left, right) => {
      if (sortMode === "name") {
        return (
          left.item.title.localeCompare(right.item.title, undefined, {
            sensitivity: "base",
          }) || left.index - right.index
        );
      }

      if (sortMode === "recent-update") {
        return (
          timestampScore(right.item) - timestampScore(left.item) ||
          left.item.title.localeCompare(right.item.title, undefined, {
            sensitivity: "base",
          }) ||
          left.index - right.index
        );
      }

      if (sortMode === "more-description") {
        return (
          descriptionScore(right.item) - descriptionScore(left.item) ||
          left.item.title.localeCompare(right.item.title, undefined, {
            sensitivity: "base",
          }) ||
          left.index - right.index
        );
      }

      return (
        Number(hasGuideItemMedia(right.item)) -
          Number(hasGuideItemMedia(left.item)) ||
        timestampScore(right.item) - timestampScore(left.item) ||
        createdAtScore(right.item) - createdAtScore(left.item) ||
        descriptionScore(right.item) - descriptionScore(left.item) ||
        left.item.title.localeCompare(right.item.title, undefined, {
          sensitivity: "base",
        }) ||
        left.index - right.index
      );
    })
    .map(({ item }) => item);

const hotelCategoryByBudget = {
  $: "Budget Hotels",
  $$: "Moderate Hotels",
  $$$: "Expensive Hotels",
  $$$$: "Luxury Hotels",
} as const;

const arabicHotelCategoryByBudget = {
  $: "فنادق اقتصادية",
  $$: "فنادق متوسطة",
  $$$: "فنادق مرتفعة التكلفة",
  $$$$: "فنادق فاخرة",
} as const;

type HotelBudgetTag = keyof typeof hotelCategoryByBudget;

const normalizeBudgetTag = (value?: string): HotelBudgetTag | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    trimmed === "$" ||
    trimmed === "$$" ||
    trimmed === "$$$" ||
    trimmed === "$$$$"
  ) {
    return trimmed;
  }

  const normalized = trimmed.toLowerCase();
  if (/moderate[/-]expensive|expensive[/-]moderate|expensive/.test(normalized))
    return "$$$";
  if (/luxury|premium|five[ -]?star|5[ -]?star/.test(normalized)) return "$$$$";
  if (
    /budget[/-]mid|budget[/-]moderate|moderate|mid[ -]?range/.test(normalized)
  )
    return "$$";
  if (/budget|cheap|economy|inexpensive/.test(normalized)) return "$";

  return undefined;
};

const inferHotelBudgetTag = (item: GuideItem): HotelBudgetTag | undefined => {
  const category = item.category.toLowerCase();
  const descriptiveText = [item.description, item.originalContent?.[0]]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    /moderate[/-]expensive|expensive[/-]moderate|expensive|upscale|large international|large central|large view|modern hotel|historic upscale/.test(
      category,
    )
  )
    return "$$$";
  if (/luxury|premium|five[ -]?star|5[ -]?star/.test(category)) return "$$$$";
  if (
    /budget[/-]mid|budget[/-]moderate|moderate|mid[ -]?range|serviced apartment|guesthouse|guest house|bnb/.test(
      category,
    )
  )
    return "$$";
  if (/budget|compact|hostel|economy|cheap/.test(category)) return "$";

  if (/hostel|spartan|value for money|basic/.test(descriptiveText)) return "$";
  if (/5[ -]?star|five[ -]?star|luxury hotel|grand hotel/.test(descriptiveText))
    return "$$$$";
  if (
    /upscale|polished|conference|business hotel|view hotel|high-capacity/.test(
      descriptiveText,
    )
  )
    return "$$$";
  if (
    /private hotel|family run|guesthouse|comfortable|aparthotel|kitchenette/.test(
      descriptiveText,
    )
  )
    return "$$";

  return undefined;
};

const hotelTierCategory = (value?: string) => {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return undefined;
  return Object.values(hotelCategoryByBudget).find(
    (category) => category.toLowerCase() === normalized,
  );
};

const guideItemMetaTags = (item: GuideItem, locale: "en" | "ar" = "en") => {
  const tags: { kind: "category" | "budget"; label: string }[] = [];
  const addTag = (kind: "category" | "budget", label?: string) => {
    const normalized = label?.trim();
    if (
      !normalized ||
      normalized === item.title ||
      tags.some((tag) => tag.label === normalized)
    ) {
      return;
    }
    tags.push({ kind, label: normalized });
  };

  if (item.kind === "hotel") {
    const budget = normalizeBudgetTag(item.budget) ?? inferHotelBudgetTag(item);
    const hotelCategory =
      locale === "ar" && budget
        ? arabicHotelCategoryByBudget[budget]
        : (hotelTierCategory(item.category) ??
          (budget ? hotelCategoryByBudget[budget] : item.category));
    addTag("category", hotelCategory);
    addTag("budget", budget);
    return tags;
  }

  addTag("category", item.category);
  addTag("budget", normalizeBudgetTag(item.budget) ?? item.budget);
  return tags;
};

export function GuideItemCard({
  city,
  cityName = city.name,
  item,
  labels = defaultGuideItemLabels,
  layout = "grid",
  locale = "en",
  pathPrefix = "",
}: {
  city: CityGuide;
  cityName?: string;
  item: GuideItem;
  labels?: GuideItemLabels;
  layout?: "grid" | "rail";
  locale?: "en" | "ar";
  pathPrefix?: string;
}) {
  const itemPath = `${pathPrefix}${pathForGuideItem(city, item)}`;
  const visual = getGuideItemImage(item);
  const metaTags = guideItemMetaTags(item, locale);

  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border-ink/10 bg-white shadow-none transition duration-300 hover:border-ink/25 hover:shadow-[0_18px_45px_rgba(17,17,17,0.10)]",
        layout === "rail" ? "w-[282px] shrink-0" : "w-full",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-paper-deep">
        <Link className="absolute inset-0" href={itemPath}>
          <Image
            alt={item.imageAlt}
            className="object-cover"
            fill
            quality={90}
            sizes={
              layout === "rail"
                ? "640px"
                : "(min-width: 1280px) 760px, (min-width: 768px) 72vw, 100vw"
            }
            src={visual.image}
            style={{ objectPosition: visual.objectPosition }}
          />
        </Link>
        <Badge
          className="absolute left-3 top-3 w-fit max-w-[185px] overflow-hidden text-ellipsis border-transparent bg-[#16325c] text-[11px] leading-none text-white shadow-sm rtl:left-auto rtl:right-3"
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
      <CardContent className="flex flex-1 flex-col px-3.5 py-3">
        <p className="text-[12px] font-bold leading-4 text-travel-navy/65">
          {cityName}
        </p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug tracking-[0.005em] text-travel-navy">
          <Link className="hover:underline" href={itemPath}>
            {item.title}
          </Link>
        </h3>
        {metaTags.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {metaTags.map((tag) => (
              <Badge
                className={cn(
                  "px-2 py-0.5 text-[10px] leading-none",
                  locale === "ar" ? "tracking-normal" : "tracking-[0.1em]",
                )}
                key={`${tag.kind}:${tag.label}`}
                variant={tag.kind === "budget" ? "outline" : "secondary"}
              >
                {tag.label}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="mt-1.5 line-clamp-2 text-[13px] leading-[1.45] text-travel-navy/85">
          {guideItemCardDescription(item)}
        </p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3.5">
          <DiscoverLink href={itemPath} label={labels.discover} />
          <div className="ms-auto flex items-center gap-3">
            {item.geoStatus === "verified" ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-bold text-travel-navy">
                <ShieldCheck
                  aria-hidden="true"
                  className="h-4 w-4 text-coastal"
                />
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
  limit,
  pathPrefix = "",
  preserveOrder = false,
  sortMode = "media",
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
  limit?: number;
  pathPrefix?: string;
  preserveOrder?: boolean;
  sortMode?: GuideCardSortMode;
  subtitle: string;
  title: string;
}) {
  const navLabels =
    dir === "rtl"
      ? { previous: "السابق", next: "التالي" }
      : { previous: "Previous", next: "Next" };

  const sortedItems = preserveOrder
    ? items
    : sortGuideItemsForCards(items, sortMode);
  const visibleItems =
    typeof limit === "number" ? sortedItems.slice(0, limit) : sortedItems;

  const cards: FeatureCardData[] = visibleItems.map((item, index) => {
    const visual = getGuideItemImage(item);
    return {
      key: item.id,
      href: `${pathPrefix}${pathForGuideItem(city, item)}`,
      image: visual.image,
      imageAlt: item.imageAlt,
      objectPosition: visual.objectPosition,
      eyebrow: item.eyebrow,
      title: item.title,
      description: guideItemCardDescription(item),
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
  locale = "en",
  preserveOrder = false,
  sortMode = "media",
  pathPrefix = "",
}: {
  city: CityGuide;
  cityName?: string;
  items: GuideItem[];
  labels?: GuideItemLabels;
  locale?: "en" | "ar";
  preserveOrder?: boolean;
  sortMode?: GuideCardSortMode;
  pathPrefix?: string;
}) {
  const sortedItems = preserveOrder
    ? items
    : sortGuideItemsForCards(items, sortMode);

  return (
    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {sortedItems.map((item) => (
        <GuideItemCard
          city={city}
          cityName={cityName}
          item={item}
          key={item.id}
          labels={labels}
          locale={locale}
          pathPrefix={pathPrefix}
        />
      ))}
    </div>
  );
}
