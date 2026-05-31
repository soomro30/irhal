import type { Metadata } from "next";

import { CityPageContent } from "@/app/(frontend)/city/[city]/page";
import { getCityBySlug } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const cityTranslation = city.translations?.ar ?? {};
  const cityName =
    (typeof cityTranslation.name === "string" && cityTranslation.name) ||
    (city.slug === "karachi" ? "كراتشي" : city.name);
  const title =
    (typeof cityTranslation.seoTitle === "string" &&
      cityTranslation.seoTitle) ||
    `دليل السفر إلى ${cityName}`;
  const description =
    (typeof cityTranslation.seoDescription === "string" &&
      cityTranslation.seoDescription) ||
    (city.slug === "karachi"
      ? "دليل كراتشي من إرحل: أفضل الأماكن للزيارة، المطاعم، الفنادق، التسوق، المناطق، ومعلومات الطقس والعملة والسلامة للمسافر."
      : city.seo.description);

  return pageMetadata({
    title,
    description,
    path: `/ar/city/${city.slug}`,
  });
}

export default async function ArabicCityPage(props: Props) {
  return <CityPageContent {...props} locale="ar" />;
}
