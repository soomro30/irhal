import type { Metadata } from "next";

import { pathForListing, type CityGuide, type Listing, type Neighborhood } from "./city-data";

export type PageLocale = "en" | "ar";

export const siteUrl = () => {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === "production" && !url) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required for production SEO metadata.");
  }

  return url || "http://localhost:3000";
};

export const absoluteUrl = (path: string) => new URL(path, siteUrl()).toString();

export const localizedPath = (path: string, locale: PageLocale) => {
  const pathWithoutLocale = path.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  if (pathWithoutLocale === "/") return locale === "ar" ? "/" : "/en";
  return `/${locale}${pathWithoutLocale}`;
};

export const localizedUrl = (path: string, locale: PageLocale) =>
  absoluteUrl(localizedPath(path, locale));

export const localizedCityName = (city: CityGuide, locale: PageLocale) => {
  const translation = city.translations?.[locale];
  return (
    (typeof translation?.name === "string" && translation.name) ||
    (locale === "ar" && city.slug === "karachi" ? "كراتشي" : city.name)
  );
};

export const pageMetadata = ({
  title,
  description,
  path,
  robots,
}: {
  title: string;
  description: string;
  path: string;
  robots?: Metadata["robots"];
}): Metadata => {
  const pathWithoutLocale = path.replace(/^\/(ar|en)(?=\/|$)/, "") || "/";
  const enPath = pathWithoutLocale === "/" ? "/en" : `/en${pathWithoutLocale}`;
  const arPath = pathWithoutLocale === "/" ? "/" : `/ar${pathWithoutLocale}`;
  const canonicalPath = path.startsWith("/ar") || path.startsWith("/en")
    ? path
    : pathWithoutLocale === "/"
      ? "/"
      : enPath;

  return {
    title,
    description,
    ...(robots ? { robots } : {}),
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: enPath,
        ar: arPath,
        "x-default": arPath,
      },
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: canonicalPath,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
};

const jsonLdPath = (path: string, locale?: PageLocale) =>
  locale ? localizedUrl(path, locale) : absoluteUrl(path);

export const breadcrumbJsonLd = (
  items: { name: string; path: string }[],
  locale?: PageLocale,
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: jsonLdPath(item.path, locale),
  })),
});

export const cityJsonLd = (city: CityGuide, locale: PageLocale = "en") => ({
  "@context": "https://schema.org",
  "@type": ["TravelGuide", "TouristDestination"],
  name: localizedCityName(city, locale),
  description: city.seo.description,
  url: localizedUrl(`/city/${city.slug}`, locale),
  geo: {
    "@type": "GeoCoordinates",
    latitude: city.latitude,
    longitude: city.longitude,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: city.name,
    addressCountry: city.country,
  },
  dateModified: city.lastVerifiedAt,
});

export const neighborhoodJsonLd = (
  city: CityGuide,
  neighborhood: Neighborhood,
  locale: PageLocale = "en",
) => {
  const translation = neighborhood.translations?.[locale];
  const neighborhoodName =
    (typeof translation?.name === "string" && translation.name) ||
    neighborhood.name;
  const description =
    (typeof translation?.description === "string" && translation.description) ||
    (typeof translation?.operatingGuide === "string" &&
      translation.operatingGuide) ||
    neighborhood.operatingGuide;
  const cityName = localizedCityName(city, locale);

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${neighborhoodName}, ${cityName}`,
    description,
    url: localizedUrl(
      `/city/${city.slug}/neighborhood/${neighborhood.slug}`,
      locale,
    ),
    geo: {
      "@type": "GeoCoordinates",
      latitude: neighborhood.latitude,
      longitude: neighborhood.longitude,
    },
  };
};

const guideItemSchemaType: Record<string, string> = {
  family: "TouristAttraction",
  festival: "Festival",
  hotel: "Hotel",
  masjid: "PlaceOfWorship",
  place: "TouristAttraction",
  restaurant: "Restaurant",
  shopping: "ShoppingCenter",
  tour: "TouristTrip",
};

export const guideItemJsonLd = ({
  citySlug,
  cityName,
  country,
  kind,
  slug,
  title,
  description,
  image,
  address,
  locale = "en",
}: {
  citySlug: string;
  cityName: string;
  country: string;
  kind: string;
  slug: string;
  title: string;
  description: string;
  image?: string;
  address?: string;
  locale?: PageLocale;
}) => ({
  "@context": "https://schema.org",
  "@type": guideItemSchemaType[kind] ?? "TouristAttraction",
  name: title,
  description,
  url: localizedUrl(
    `/city/${citySlug}/${kind === "family" ? "family" : kind}/${slug}`,
    locale,
  ),
  ...(image ? { image: image.startsWith("http") ? image : absoluteUrl(image) } : {}),
  address: {
    "@type": "PostalAddress",
    streetAddress: address || undefined,
    addressLocality: cityName,
    addressCountry: country,
  },
});

export const listingJsonLd = (
  city: CityGuide,
  listing: Listing,
  locale: PageLocale = "en",
) => ({
  "@context": "https://schema.org",
  "@type": listing.seo.schemaType,
  name: listing.name,
  description: listing.shortDescription,
  url: localizedUrl(pathForListing(city, listing), locale),
  address: listing.address,
  geo: {
    "@type": "GeoCoordinates",
    latitude: listing.latitude,
    longitude: listing.longitude,
  },
});
