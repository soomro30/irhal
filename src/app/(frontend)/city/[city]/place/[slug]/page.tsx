import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { GuideItemDetail } from "@/components/guide-item-detail";
import { ListingDetail } from "@/components/listing-detail";
import { getCityBySlug } from "@/lib/city-source";
import {
  canonicalArticlePathForGuideItem,
  getGuideItem,
  localizeGuideItem,
} from "@/lib/guide-items";
import { localizedCityName, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string; slug: string }>;
};

export async function generateStaticParams() {
  return [];
}

type PageLocale = "en" | "ar";

const articleRedirectByPlaceSlug: Record<
  string,
  { articleSlug: string; sectionSlug: string }
> = {
  "london-currency-and-exchange-rates": {
    articleSlug: "exchange-rates",
    sectionSlug: "visitor-information",
  },
  "london-fast-facts": {
    articleSlug: "fast-facts",
    sectionSlug: "visitor-information",
  },
  "driving-tips-for-london": {
    articleSlug: "driving-tips",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-buses": {
    articleSlug: "buses",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-history": {
    articleSlug: "city-back-then",
    sectionSlug: "city-information",
  },
  "london-public-holidays": {
    articleSlug: "public-holidays-england-and-wales-2026",
    sectionSlug: "visitor-information",
  },
  "london-today": {
    articleSlug: "city-today",
    sectionSlug: "city-information",
  },
  "london-taxis": {
    articleSlug: "taxis-and-ride-hailing",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-underground-tube": {
    articleSlug: "underground-and-elizabeth-line",
    sectionSlug: "transportation-and-getting-around",
  },
  "london-visa-information": {
    articleSlug: "visa-and-eta-information",
    sectionSlug: "visitor-information",
  },
  "london-weather-and-annual-temperature": {
    articleSlug: "annual-temperature-and-rainfall",
    sectionSlug: "visitor-information",
  },
  "when-to-go-to-london": {
    articleSlug: "when-to-go",
    sectionSlug: "visitor-information",
  },
};

export const cityInformationArticleRedirectPath = (
  citySlug: string,
  slug: string,
  locale: PageLocale,
) => {
  const article = articleRedirectByPlaceSlug[slug];
  if (!article) return undefined;
  const pathPrefix = locale === "ar" ? "/ar" : "/en";
  return `${pathPrefix}/city/${citySlug}/section/${article.sectionSlug}/${article.articleSlug}`;
};

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
  const redirectPath = cityInformationArticleRedirectPath(
    citySlug,
    slug,
    locale,
  );
  if (redirectPath) redirect(redirectPath);

  const { city, guideItem, listing } = await findPlace(citySlug, slug);
  if (!city) notFound();
  if (guideItem) {
    const canonicalArticlePath = canonicalArticlePathForGuideItem(city, guideItem);
    if (canonicalArticlePath) {
      const pathPrefix = locale === "ar" ? "/ar" : "/en";
      redirect(`${pathPrefix}${canonicalArticlePath}`);
    }
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
  const { city: citySlug, slug } = await props.params;
  const redirectPath = cityInformationArticleRedirectPath(citySlug, slug, "en");
  if (redirectPath) redirect(redirectPath);

  return <PlacePageContent {...props} />;
}
