import type { Metadata } from "next";

import type { CityGuide, Listing, Neighborhood } from "./city-data";

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const absoluteUrl = (path: string) => new URL(path, siteUrl()).toString();

export const pageMetadata = ({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata => ({
  title,
  description,
  alternates: {
    canonical: absoluteUrl(path),
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: absoluteUrl(path),
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
});

export const breadcrumbJsonLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const cityJsonLd = (city: CityGuide) => ({
  "@context": "https://schema.org",
  "@type": ["TravelGuide", "TouristDestination"],
  name: city.name,
  description: city.seo.description,
  url: absoluteUrl(`/city/${city.slug}`),
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

export const neighborhoodJsonLd = (city: CityGuide, neighborhood: Neighborhood) => ({
  "@context": "https://schema.org",
  "@type": "Place",
  name: `${neighborhood.name}, ${city.name}`,
  description: neighborhood.operatingGuide,
  url: absoluteUrl(`/city/${city.slug}/neighborhood/${neighborhood.slug}`),
  geo: {
    "@type": "GeoCoordinates",
    latitude: neighborhood.latitude,
    longitude: neighborhood.longitude,
  },
});

export const listingJsonLd = (city: CityGuide, listing: Listing) => ({
  "@context": "https://schema.org",
  "@type": listing.seo.schemaType,
  name: listing.name,
  description: listing.shortDescription,
  url: absoluteUrl(`/city/${city.slug}/${listing.listingType === "place" || listing.listingType === "islamic-landmark" ? "place" : listing.listingType}/${listing.slug}`),
  address: listing.address,
  geo: {
    "@type": "GeoCoordinates",
    latitude: listing.latitude,
    longitude: listing.longitude,
  },
});
