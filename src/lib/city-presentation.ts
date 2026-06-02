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

type LocalizedNeighbourhoodCopy = {
  description: string;
  name: string;
};

const GENERIC_FALLBACK_IMAGE = "/images/karachi-guide/place.svg";

const karachiArabicNeighbourhoodCopy: Record<
  string,
  LocalizedNeighbourhoodCopy
> = {
  "airport-malir": {
    description:
      "منطقة عملية للوصول والمغادرة المبكرة وترتيبات العائلات والإقامة القريبة من مطار جناح الدولي.",
    name: "المطار وملير",
  },
  "boat-basin-zamzama": {
    description:
      "تجمعات مطاعم ومقاهٍ تناسب أمسيات هادئة مع كليفتون ودي إتش إيه.",
    name: "بوت بيسن وزمزما",
  },
  "burns-road": {
    description:
      "منطقة طعام في المدينة القديمة للأطباق الكلاسيكية، والتوقفات المسائية القصيرة، والمشي قرب مواقع التراث.",
    name: "بيرنز رود",
  },
  clifton: {
    description:
      "تصلح كليفتون كقاعدة ساحلية مميزة للزوار أول مرة، والعائلات، والمراكز التجارية، والمطاعم، والوصول إلى الشاطئ، والتنقلات القصيرة نحو دي إتش إيه.",
    name: "كليفتون",
  },
  dha: {
    description:
      "منطقة سكنية وتجارية قريبة من المطاعم والمقاهي والواجهة البحرية، ومناسبة للتنقل بين كليفتون وزمزما ودو دريا.",
    name: "دي إتش إيه",
  },
  "gulshan-e-iqbal": {
    description:
      "منطقة مفيدة للوجهات العائلية والجامعات والحدائق والمطاعم المتوسطة والتنقل في شرق كراتشي.",
    name: "غلشن إقبال",
  },
  pechs: {
    description:
      "قاعدة سكنية وتجارية مركزية تضم مقاهي وفنادق عملية وشوارع طعام، مع وصول سريع نحو طارق رود.",
    name: "بي إي سي إتش إس",
  },
  saddar: {
    description:
      "صدر هي القلب التاريخي التجاري الكثيف، ومفيدة للمعالم ذات الطابع الاستعماري والأسواق وشوارع الطعام القديمة ومسارات التراث.",
    name: "صدر",
  },
  "tariq-road": {
    description:
      "حي تسوق نشط للأزياء والمراكز التجارية والمطاعم غير الرسمية وحركة التجزئة المسائية.",
    name: "طارق رود",
  },
};

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
      description: description ?? item.description,
      name: name ?? item.name,
      slug: item.slug,
    };
  }
  return karachiArabicNeighbourhoodCopy[item.slug] ?? item;
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
      (item.imageUrl && !item.imageUrl.endsWith(".svg")),
  );

/**
 * Resolves the best available image for a guide item. Payload-managed media is
 * canonical; otherwise the per-kind placeholder carried on the item is shown.
 */
export const getGuideItemImage = (item: GuideItem): ImageVisual => {
  if (item.galleryUrls && item.galleryUrls.length > 0) {
    return { image: item.galleryUrls[0], objectPosition: "center" };
  }
  if (item.cmsImageUrl) {
    return { image: item.cmsImageUrl, objectPosition: "center" };
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
