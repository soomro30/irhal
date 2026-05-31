import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { ListingDetail } from "@/components/listing-detail";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem, localizeGuideItem } from "@/lib/guide-items";
import { localizedCityName, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

type PageLocale = "en" | "ar";

const findPlace = async (citySlug: string, slug: string) => {
  const city = await getCityBySlug(citySlug);
  const guideItem = city ? getGuideItem(city, "place", slug) : undefined;
  const listing = city?.listings.find(
    (item) => (item.listingType === "place" || item.listingType === "islamic-landmark") && item.slug === slug,
  );
  return { city, guideItem, listing };
};

export async function generatePlaceMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const { city, guideItem, listing } = await findPlace(citySlug, slug);
  if (!city) return {};

  if (guideItem) {
    const displayItem = localizeGuideItem(guideItem, locale);
    const cityName = localizedCityName(city, locale);

    return pageMetadata({
      title: `${displayItem.title} | ${cityName}`,
      description: displayItem.description,
      path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/place/${guideItem.slug}`,
    });
  }

  if (!listing) return {};
  return pageMetadata({
    title: listing.seo.title,
    description: listing.seo.description,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/place/${listing.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generatePlaceMetadata(props);
}

export async function PlacePageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, slug } = await params;
  const { city, guideItem, listing } = await findPlace(citySlug, slug);
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

export default async function PlacePage(props: Props) {
  return <PlacePageContent {...props} />;
}
