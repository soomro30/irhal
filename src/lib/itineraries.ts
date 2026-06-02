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

export const itineraryStopCount = (itinerary: Itinerary) =>
  itinerary.days.reduce((count, day) => count + day.stops.length, 0);
