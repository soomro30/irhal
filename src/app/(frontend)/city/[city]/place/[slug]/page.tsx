import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { ListingDetail } from "@/components/listing-detail";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem } from "@/lib/guide-items";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

const findPlace = async (citySlug: string, slug: string) => {
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "place", slug) : undefined;
  const listing = city?.listings.find(
    (item) => (item.listingType === "place" || item.listingType === "islamic-landmark") && item.slug === slug,
  );
  return { city, guideItem, listing };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const { city, guideItem, listing } = await findPlace(citySlug, slug);
  if (!city) return {};

  if (guideItem) {
    return pageMetadata({
      title: `${guideItem.title} | ${city.name}`,
      description: guideItem.description,
      path: `/city/${city.slug}/place/${guideItem.slug}`,
    });
  }

  if (!listing) return {};
  return pageMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    path: `/city/${city.slug}/place/${listing.slug}`,
  });
}

export default async function PlacePage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const { city, guideItem, listing } = await findPlace(citySlug, slug);
  if (!city) notFound();
  if (guideItem) return <GuideItemDetail city={city} item={guideItem} />;
  if (listing) return <ListingDetail city={city} listing={listing} />;
  notFound();
}
