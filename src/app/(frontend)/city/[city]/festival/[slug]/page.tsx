import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem, localizeGuideItem } from "@/lib/guide-items";
import { localizedCityName, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

type PageLocale = "en" | "ar";

export async function generateFestivalMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const item = city ? getGuideItem(city, "festival", slug) : undefined;
  if (!city || !item) return {};

  const displayItem = localizeGuideItem(item, locale);
  const cityName = localizedCityName(city, locale);

  return pageMetadata({
    title: `${displayItem.title} | ${cityName}`,
    description: displayItem.description,
    path: `${locale === "ar" ? "/ar" : "/en"}/city/${city.slug}/festival/${item.slug}`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generateFestivalMetadata(props);
}

export async function FestivalPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const item = city ? getGuideItem(city, "festival", slug) : undefined;
  if (!city || !item) notFound();

  return (
    <GuideItemDetail
      city={city}
      item={localizeGuideItem(item, locale)}
      locale={locale}
    />
  );
}

export default async function FestivalPage(props: Props) {
  return <FestivalPageContent {...props} />;
}
