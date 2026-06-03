import type { CityGuide } from "./city-data";
import type { GuideItem } from "./guide-items";

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
};

type Locale = "en" | "ar";

const GENERIC_FALLBACK_IMAGE = "/images/karachi-guide/place.svg";

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

const localizeKarachiNeighbourhood = (
  citySlug: string,
  item: Pick<NeighbourhoodHighlight, "description" | "name" | "slug"> & {
    translations?: CityGuide["translations"];
  },
  locale: Locale,
) => {
  if (locale !== "ar" || citySlug !== "karachi") return item;
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
    image: item.imageUrl,
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
  return city.neighborhoods.map((neighbourhood) => {
    const localized = localizeKarachiNeighbourhood(
      city.slug,
      {
        description: neighbourhood.operatingGuide,
        name: neighbourhood.name,
        slug: neighbourhood.slug,
        translations: neighbourhood.translations,
      },
      locale,
    );

    return {
      slug: neighbourhood.slug,
      name: localized.name,
      description: localized.description,
      href: `${localePrefix}/city/${city.slug}/neighborhood/${neighbourhood.slug}`,
      external: false,
    };
  });
};
