import {
  pathForListing,
  type CityGuide,
  type Itinerary,
  type Listing,
} from "./city-data";
import { getGuideItemImage } from "./city-presentation";
import {
  getGuideItems,
  localizeGuideItem,
  type GuideItem,
  type GuideItemKind,
} from "./guide-items";

type PageLocale = "en" | "ar";

export type ResolvedItineraryStop = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  href?: string;
  imageAlt: string;
  imageUrl: string;
  mapUrl?: string;
};

const placeholderImage = "/images/karachi-guide/place.svg";
const isPlaceholderImage = (imageUrl: string) => imageUrl.endsWith(".svg");

const arabicTextPattern = /[\u0600-\u06ff]/;

const hasArabicText = (value: unknown): value is string =>
  typeof value === "string" && arabicTextPattern.test(value);

const translatedString = (
  value: unknown,
  fallback: string,
  locale: PageLocale,
) => {
  if (locale === "ar") return hasArabicText(value) ? value.trim() : fallback;
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

const localizedNumber = (value: number, locale: PageLocale) =>
  new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-arab" : "en").format(
    value,
  );

export const formatItineraryDuration = (
  durationDays: number,
  locale: PageLocale,
) => {
  if (locale !== "ar") {
    return `${localizedNumber(durationDays, locale)} ${
      durationDays === 1 ? "day" : "days"
    }`;
  }

  if (durationDays === 1) return "يوم واحد";
  if (durationDays === 2) return "يومان";
  if (durationDays >= 3 && durationDays <= 10) {
    return `${localizedNumber(durationDays, locale)} أيام`;
  }

  return `${localizedNumber(durationDays, locale)} يومًا`;
};

export const formatItineraryStopCount = (
  stopCount: number,
  locale: PageLocale,
) => {
  if (locale !== "ar") {
    return `${localizedNumber(stopCount, locale)} ${
      stopCount === 1 ? "stop" : "stops"
    }`;
  }

  if (stopCount === 1) return "محطة واحدة";
  if (stopCount === 2) return "محطتان";
  if (stopCount >= 3 && stopCount <= 10) {
    return `${localizedNumber(stopCount, locale)} محطات`;
  }

  return `${localizedNumber(stopCount, locale)} محطة`;
};

export const formatItineraryDayNumber = (
  dayNumber: number,
  locale: PageLocale,
) => localizedNumber(dayNumber, locale);

export const localizeItinerary = (
  itinerary: Itinerary,
  locale: PageLocale,
): Itinerary => {
  if (locale === "en") return itinerary;

  const translation =
    itinerary.translations?.[locale] &&
    typeof itinerary.translations[locale] === "object"
      ? (itinerary.translations[locale] as Record<string, unknown>)
      : {};
  const missingCopy =
    "محتوى هذا المسار غير مكتمل في نظام إدارة المحتوى.";
  const planning =
    translation.planning && typeof translation.planning === "object"
      ? (translation.planning as Record<string, unknown>)
      : {};
  const meals =
    planning.meals && typeof planning.meals === "object"
      ? (planning.meals as Record<string, unknown>)
      : {};
  const translatedDays = Array.isArray(translation.days)
    ? (translation.days as Record<string, unknown>[])
    : [];
  const dayTranslationByNumber = new Map(
    translatedDays.map((day) => [Number(day.dayNumber), day]),
  );

  return {
    ...itinerary,
    audience: translatedString(translation.audience, "مسافر", locale),
    intro: translatedString(translation.intro, missingCopy, locale),
    planning: {
      meals: {
        breakfast: translatedString(meals.breakfast, "", locale) || undefined,
        dinner: translatedString(meals.dinner, "", locale) || undefined,
        lunch: translatedString(meals.lunch, "", locale) || undefined,
      },
      stay: translatedString(planning.stay, "", locale) || undefined,
      transport: translatedString(planning.transport, "", locale) || undefined,
    },
    summary: translatedString(translation.summary, missingCopy, locale),
    title: translatedString(translation.title, "مسار قيد الترجمة", locale),
    days: itinerary.days.map((day) => {
      const translatedDay = dayTranslationByNumber.get(day.dayNumber) ?? {};

      return {
        ...day,
        breakfast:
          translatedString(translatedDay.breakfast, "", locale) || undefined,
        description:
          translatedString(translatedDay.description, "", locale) || undefined,
        dinner: translatedString(translatedDay.dinner, "", locale) || undefined,
        lunch: translatedString(translatedDay.lunch, "", locale) || undefined,
        pacing:
          translatedString(translatedDay.pacing, "", locale) || undefined,
        routeNotes: translatedString(translatedDay.routeNotes, missingCopy, locale),
        start: translatedString(translatedDay.start, "", locale) || undefined,
        theme: translatedString(translatedDay.theme, "تفاصيل اليوم قيد الترجمة", locale),
        transport:
          translatedString(translatedDay.transport, "", locale) || undefined,
      };
    }),
  };
};

const guideItemKindPriority = (
  audience: string,
): GuideItemKind[] =>
  audience === "family"
    ? ["family", "place", "restaurant", "shopping", "masjid", "tour", "hotel", "festival"]
    : ["place", "restaurant", "masjid", "shopping", "family", "tour", "hotel", "festival"];

const prefixedKindAndSlug = (value: string) => {
  const [maybeKind, ...slugParts] = value.split(":");
  if (slugParts.length === 0) return { slug: value };

  return {
    kind: maybeKind as GuideItemKind,
    slug: slugParts.join(":"),
  };
};

const guideItemPath = (city: CityGuide, item: GuideItem) =>
  `/city/${city.slug}/${item.kind}/${item.slug}`;

const stopFromGuideItem = ({
  city,
  item,
  locale,
}: {
  city: CityGuide;
  item: GuideItem;
  locale: PageLocale;
}): ResolvedItineraryStop => {
  const displayItem = localizeGuideItem(item, locale);

  return {
    slug: item.slug,
    title: displayItem.title,
    description: displayItem.description,
    eyebrow: displayItem.eyebrow,
    href: `${locale === "ar" ? "/ar" : "/en"}${guideItemPath(city, item)}`,
    imageAlt: displayItem.imageAlt,
    imageUrl: getGuideItemImage(item).image,
    mapUrl: item.mapUrl,
  };
};

const stopFromListing = ({
  city,
  listing,
  locale,
}: {
  city: CityGuide;
  listing: Listing;
  locale: PageLocale;
}): ResolvedItineraryStop => ({
  slug: listing.slug,
  title: listing.name,
  description: listing.shortDescription,
  eyebrow: listing.listingType,
  href: `${locale === "ar" ? "/ar" : "/en"}${pathForListing(city, listing)}`,
  imageAlt: `${listing.name} in ${city.name}`,
  imageUrl: city.heroImageUrl || placeholderImage,
  mapUrl: listing.mapUrl,
});

export const resolveItineraryStops = ({
  city,
  itinerary,
  locale = "en",
}: {
  city: CityGuide;
  itinerary: Itinerary;
  locale?: PageLocale;
}) => {
  const guideItems = getGuideItems(city);
  const listingBySlug = new Map(city.listings.map((listing) => [listing.slug, listing]));
  const priority = guideItemKindPriority(itinerary.audience);

  return itinerary.days.map((day) => ({
    ...day,
    stops: day.stops.map((stopSlug) => {
      const { kind, slug } = prefixedKindAndSlug(stopSlug);
      const guideItemMatches = guideItems.filter(
        (item) => item.slug === slug && (!kind || item.kind === kind),
      );
      const guideItem =
        guideItemMatches.find((item) => item.kind === kind) ||
        priority
          .map((candidateKind) =>
            guideItemMatches.find((item) => item.kind === candidateKind),
          )
          .find(Boolean);

      if (guideItem) {
        return stopFromGuideItem({ city, item: guideItem, locale });
      }

      const listing = listingBySlug.get(slug);
      if (listing) {
        return stopFromListing({ city, listing, locale });
      }

      return {
        slug,
        title: slug.replace(/-/g, " "),
        description: day.routeNotes,
        eyebrow: "Route stop",
        imageAlt: `${slug.replace(/-/g, " ")} in ${city.name}`,
        imageUrl: city.heroImageUrl || placeholderImage,
      };
    }),
  }));
};

export const itineraryHeroImage = ({
  city,
  itinerary,
  locale = "en",
}: {
  city: CityGuide;
  itinerary: Itinerary;
  locale?: PageLocale;
}) => {
  const stops = resolveItineraryStops({ city, itinerary, locale }).flatMap(
    (day) => day.stops,
  );

  return (
    stops.find((stop) => !isPlaceholderImage(stop.imageUrl))?.imageUrl ||
    city.heroImageUrl ||
    stops[0]?.imageUrl ||
    placeholderImage
  );
};

export const itineraryCardImageMap = ({
  city,
  itineraries,
  locale = "en",
}: {
  city: CityGuide;
  itineraries: Itinerary[];
  locale?: PageLocale;
}) => {
  const usedImages = new Set<string>();
  const imageBySlug: Record<string, string> = {};

  for (const itinerary of itineraries) {
    const stops = resolveItineraryStops({ city, itinerary, locale }).flatMap(
      (day) => day.stops,
    );
    const candidates = Array.from(
      new Set(
        stops
          .map((stop) => stop.imageUrl)
          .filter((imageUrl) => !isPlaceholderImage(imageUrl)),
      ),
    );
    const selected =
      candidates.find((imageUrl) => !usedImages.has(imageUrl)) ??
      candidates[0] ??
      city.heroImageUrl ??
      stops[0]?.imageUrl ??
      placeholderImage;

    imageBySlug[itinerary.slug] = selected;
    if (!isPlaceholderImage(selected)) usedImages.add(selected);
  }

  return imageBySlug;
};

export const itineraryStopCount = (itinerary: Itinerary) =>
  itinerary.days.reduce((count, day) => count + day.stops.length, 0);
