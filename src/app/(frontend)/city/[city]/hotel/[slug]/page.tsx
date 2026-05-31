import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { ListingDetail } from "@/components/listing-detail";
import { getListing } from "@/lib/city-data";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem, localizeGuideItem } from "@/lib/guide-items";
import { localizedCityName, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

type PageLocale = "en" | "ar";

export async function generateHotelMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "hotel", slug) : undefined;
  const listing = city ? getListing(city, "hotel", slug) : undefined;
  if (!city) return {};

  if (guideItem) {
    const displayItem = localizeGuideItem(guideItem, locale);
    const cityName = localizedCityName(city, locale);

    return pageMetadata({
      title: `${displayItem.title} | ${cityName}`,
      description: displayItem.description,
      path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/hotel/${guideItem.slug}`,
    });
  }

  if (!listing) return {};
  return pageMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/hotel/${listing.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateHotelMetadata(props);
}

export async function HotelPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "hotel", slug) : undefined;
  const listing = city ? getListing(city, "hotel", slug) : undefined;
  if (!city) notFound();
  if (guideItem) {
    return (
      <GuideItemDetail
        city={city}
        item={localizeGuideItem(guideItem, locale)}
        locale={locale}
      />
    );
  }
  if (listing) return <ListingDetail city={city} listing={listing} locale={locale} />;
  notFound();
}

export default async function HotelPage(props: Props) {
  return <HotelPageContent {...props} />;
}
