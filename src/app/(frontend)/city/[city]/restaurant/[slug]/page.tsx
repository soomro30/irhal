import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { ListingDetail } from "@/components/listing-detail";
import { getListing } from "@/lib/city-data";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem } from "@/lib/guide-items";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "restaurant", slug) : undefined;
  const listing = city ? getListing(city, "restaurant", slug) : undefined;
  if (!city) return {};

  if (guideItem) {
    return pageMetadata({
      title: `${guideItem.title} | ${city.name}`,
      description: guideItem.description,
      path: `/city/${city.slug}/restaurant/${guideItem.slug}`,
    });
  }

  if (!listing) return {};
  return pageMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    path: `/city/${city.slug}/restaurant/${listing.slug}`,
  });
}

export default async function RestaurantPage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "restaurant", slug) : undefined;
  const listing = city ? getListing(city, "restaurant", slug) : undefined;
  if (!city) notFound();
  if (guideItem) return <GuideItemDetail city={city} item={guideItem} />;
  if (listing) return <ListingDetail city={city} listing={listing} />;
  notFound();
}
