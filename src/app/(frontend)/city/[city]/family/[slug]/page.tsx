import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { getCityBySlug } from "@/lib/city-source";
import { getGuideItem } from "@/lib/guide-items";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const item = city ? getGuideItem(city, "family", slug) : undefined;
  if (!city || !item) return {};

  return pageMetadata({
    title: `${item.title} | ${city.name}`,
    description: item.description,
    path: `/city/${city.slug}/family/${item.slug}`,
  });
}

export default async function FamilyPage({ params }: Props) {
  const { city: citySlug, slug } = await params;
  const city = await getCityBySlug(citySlug);
  const item = city ? getGuideItem(city, "family", slug) : undefined;
  if (!city || !item) notFound();

  return <GuideItemDetail city={city} item={item} />;
}
