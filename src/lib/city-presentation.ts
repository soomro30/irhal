import type { CityGuide } from "./city-data";
import type { GuideItem } from "./guide-items";
import { genericGuidePlaceholderImage } from "./image-placeholders";

export type ImageVisual = {
  image: string;
  objectPosition: string;
};

export type NeighbourhoodHighlight = {
  slug: string;
  name: string;
  description: string;
  href: string;
  external: boolean;
  image?: string;
  imageAlt?: string;
  objectPosition?: string;
};

type Locale = "en" | "ar";

const GENERIC_FALLBACK_IMAGE = genericGuidePlaceholderImage;

const approvedGuideItemFallbackImages: Record<
  string,
  { image: string; objectPosition?: string }
> = {
  "place:frere-hall": {
    image: "/images/karachi-guide/place-frere-hall.jpg",
  },
  "place:karachi-port-trust-building": {
    image: "/images/karachi-guide/karachi-port-trust.jpg",
  },
  "place:mazar-e-quaid": {
    image: "/images/karachi-guide/place-mazar-e-quaid.jpg",
  },
  "place:mohatta-palace-museum": {
    image: "/images/karachi-guide/place-mohatta-palace.jpg",
  },
};

const approvedGuideItemFallback = (item: GuideItem) =>
  approvedGuideItemFallbackImages[`${item.kind}:${item.slug}`] ??
  approvedGuideItemFallbackImages[item.slug];

const localizeNeighbourhood = (
  item: Pick<NeighbourhoodHighlight, "description" | "name" | "slug"> & {
    translations?: CityGuide["translations"];
  },
  locale: Locale,
) => {
  if (locale !== "ar") return item;
  const arabic = item.translations?.ar;
  const name = typeof arabic?.name === "string" ? arabic.name : undefined;
  const description =
    typeof arabic?.description === "string"
      ? arabic.description
      : typeof arabic?.operatingGuide === "string"
        ? arabic.operatingGuide
        : undefined;
  if (name || description) {
    return {
      description:
        description ?? "وصف هذه المنطقة غير مكتمل في نظام إدارة المحتوى.",
      name: name ?? "منطقة قيد الترجمة",
      slug: item.slug,
    };
  }
  return {
    description: "وصف هذه المنطقة غير مكتمل في نظام إدارة المحتوى.",
    name: "منطقة قيد الترجمة",
    slug: item.slug,
  };
};

const guideItemNeighborhoodSlug = (city: CityGuide, item: GuideItem) =>
  item.neighborhoodSlug ??
  city.guideItemNeighborhoods?.[`${item.kind}:${item.slug}`] ??
  city.guideItemNeighborhoods?.[item.slug];

const normalizeArea = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const guideItemMatchesNeighborhood = (
  city: CityGuide,
  item: GuideItem,
  neighborhood: Pick<CityGuide["neighborhoods"][number], "name" | "slug">,
) => {
  if (guideItemNeighborhoodSlug(city, item) === neighborhood.slug) return true;

  const area = normalizeArea(item.area);
  const name = normalizeArea(neighborhood.name);
  const slug = normalizeArea(neighborhood.slug);

  return (
    Boolean(area) &&
    (area.includes(name) || area.includes(slug) || name.includes(area))
  );
};

const stableIndex = (value: string, length: number) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return length > 0 ? hash % length : 0;
};

// Picks a real media-backed guide item to represent the neighbourhood.
// Returns null when no matched item has approved media so the caller can
// drop the neighbourhood from the carousel entirely instead of reusing the
// city hero (which would mislead users with the wrong photo).
const neighbourhoodRepresentativeImage = (
  city: CityGuide,
  neighbourhood: Pick<CityGuide["neighborhoods"][number], "name" | "slug">,
) => {
  const matched = (city.guideItems ?? []).filter((item) =>
    guideItemMatchesNeighborhood(city, item, neighbourhood),
  );
  if (matched.length === 0) return null;

  const candidatesWithMedia = matched.filter((item) => hasGuideItemMedia(item));
  if (candidatesWithMedia.length === 0) return null;

  const item =
    candidatesWithMedia[
      stableIndex(neighbourhood.slug, candidatesWithMedia.length)
    ];
  const visual = getGuideItemImage(item);
  return {
    image: visual.image,
    imageAlt: item.imageAlt,
    matchedCount: matched.length,
    objectPosition: visual.objectPosition,
  };
};

export const getCityHeroImage = (city: CityGuide): string =>
  city.heroImageUrl || GENERIC_FALLBACK_IMAGE;

export const getCityHeroImages = (city: CityGuide): string[] => {
  const configuredImages = city.heroImageUrls?.length
    ? city.heroImageUrls
    : city.heroImageUrl
      ? [city.heroImageUrl]
      : [];
  const fallbackImage = city.heroImageUrl || GENERIC_FALLBACK_IMAGE;

  return Array.from(
    new Set(
      configuredImages.length > 0
        ? configuredImages
        : [fallbackImage],
    ),
  );
};

export const hasGuideItemMedia = (item: GuideItem) =>
  Boolean(
    (item.galleryUrls && item.galleryUrls.length > 0) ||
      item.cmsImageUrl ||
      approvedGuideItemFallback(item) ||
      (item.imageUrl && !item.imageUrl.endsWith(".svg")),
  );

/**
 * Resolves the best available image for a guide item. Payload-managed media is
 * canonical. Approved repo fallbacks are used only for vetted Karachi images
 * that predate full Payload media coverage; otherwise the per-kind placeholder
 * carried on the item is shown.
 */
export const getGuideItemImage = (item: GuideItem): ImageVisual => {
  if (item.galleryUrls && item.galleryUrls.length > 0) {
    return { image: item.galleryUrls[0], objectPosition: "center" };
  }
  if (item.cmsImageUrl) {
    return { image: item.cmsImageUrl, objectPosition: "center" };
  }
  const fallback = approvedGuideItemFallback(item);
  if (fallback) {
    return {
      image: fallback.image,
      objectPosition: fallback.objectPosition ?? "center",
    };
  }
  return {
    image: item.imageUrl || GENERIC_FALLBACK_IMAGE,
    objectPosition: "center",
  };
};

// Full ordered list of images for an item (primary + gallery), for carousels.
export const getGuideItemImages = (item: GuideItem): string[] => {
  if (!hasGuideItemMedia(item)) return [];
  if (item.galleryUrls && item.galleryUrls.length > 0) return item.galleryUrls;
  return [getGuideItemImage(item).image];
};

/**
 * Builds homepage neighbourhood cards only from CMS-backed neighbourhood pages.
 */
export const getNeighbourhoodHighlights = (
  city: CityGuide,
  localePrefix: string,
  locale: Locale = "en",
): NeighbourhoodHighlight[] => {
  const highlights: NeighbourhoodHighlight[] = [];
  for (const neighbourhood of city.neighborhoods) {
    const representativeImage = neighbourhoodRepresentativeImage(
      city,
      neighbourhood,
    );
    // Skip neighbourhoods with no mapped items or no media — surfacing them
    // would either show wrong fallback imagery or land users on an empty page.
    if (!representativeImage) continue;

    const localized = localizeNeighbourhood(
      {
        description: neighbourhood.operatingGuide,
        name: neighbourhood.name,
        slug: neighbourhood.slug,
        translations: neighbourhood.translations,
      },
      locale,
    );

    highlights.push({
      slug: neighbourhood.slug,
      name: localized.name,
      description: localized.description,
      href: `${localePrefix}/city/${city.slug}/neighborhood/${neighbourhood.slug}`,
      external: false,
      image: representativeImage.image,
      imageAlt: representativeImage.imageAlt,
      objectPosition: representativeImage.objectPosition,
    });
  }
  return highlights;
};
