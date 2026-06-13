import type { CityGuideItem } from "./city-data";

export const genericGuidePlaceholderImage = "/images/guide-placeholders/place.svg";

export const guidePlaceholderImageByKind: Record<CityGuideItem["kind"], string> = {
  family: "/images/guide-placeholders/family.svg",
  festival: "/images/guide-placeholders/festival.svg",
  hotel: "/images/guide-placeholders/hotel.svg",
  masjid: "/images/guide-placeholders/masjid.svg",
  place: "/images/guide-placeholders/place.svg",
  restaurant: "/images/guide-placeholders/restaurant.svg",
  shopping: "/images/guide-placeholders/shopping.svg",
  tour: "/images/guide-placeholders/tour.svg",
};
