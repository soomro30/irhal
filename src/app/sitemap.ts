import type { MetadataRoute } from "next";

import { pathForListing } from "@/lib/city-data";
import { getCityBySlug, getCityNavItems } from "@/lib/city-source";
import {
  getGuideArticlesForSection,
  getGuideItemsForSection,
  getGuideItems,
  pathForGuideItem,
  publicSectionCards,
} from "@/lib/guide-items";
import { localizedPath, type PageLocale } from "@/lib/seo";
import { getSiteSettings } from "@/lib/site-settings";

type SitemapEntry = MetadataRoute.Sitemap[number];
const SECTION_PAGE_SIZE = 24;

const absoluteFromOrigin = (origin: string, path: string) =>
  new URL(path, origin).toString();

const localizedUrl = (origin: string, path: string, locale: PageLocale) =>
  absoluteFromOrigin(origin, localizedPath(path, locale));

const alternates = (origin: string, path: string) => ({
  languages: {
    en: localizedUrl(origin, path, "en"),
    ar: localizedUrl(origin, path, "ar"),
    "x-default": localizedUrl(origin, path, "ar"),
  },
});

const addLocalizedEntries = (
  entries: SitemapEntry[],
  seen: Set<string>,
  origin: string,
  path: string,
  options: Omit<SitemapEntry, "url" | "alternates"> = {},
) => {
  (["en", "ar"] satisfies PageLocale[]).forEach((locale) => {
    const url = localizedUrl(origin, path, locale);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      alternates: alternates(origin, path),
      ...options,
    });
  });
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSiteSettings();
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  addLocalizedEntries(entries, seen, settings.siteUrl, "/", {
    changeFrequency: "weekly",
    priority: 1,
  });

  ["/about", "/news", "/travel-articles", "/special-offers"].forEach((path) => {
    addLocalizedEntries(entries, seen, settings.siteUrl, path, {
      changeFrequency: "monthly",
      priority: 0.7,
    });
  });

  const navItems = await getCityNavItems();
  const cities = (
    await Promise.all(navItems.map((city) => getCityBySlug(city.slug)))
  ).filter((city): city is NonNullable<typeof city> => Boolean(city));

  for (const city of cities) {
    const lastModified = city.lastVerifiedAt;
    const cityPath = `/city/${city.slug}`;

    addLocalizedEntries(entries, seen, settings.siteUrl, cityPath, {
      changeFrequency: "weekly",
      lastModified,
      priority: 0.95,
    });

    ["/islamic-travel", "/itineraries", "/prayer-times"].forEach((suffix) => {
      addLocalizedEntries(entries, seen, settings.siteUrl, `${cityPath}${suffix}`, {
        changeFrequency: "weekly",
        lastModified,
        priority: 0.8,
      });
    });

    city.neighborhoods.forEach((neighborhood) => {
      addLocalizedEntries(
        entries,
        seen,
        settings.siteUrl,
        `${cityPath}/neighborhood/${neighborhood.slug}`,
        {
          changeFrequency: "monthly",
          lastModified,
          priority: 0.75,
        },
      );
    });

    publicSectionCards.forEach((section) => {
      const sectionPath = `${cityPath}/section/${section.slug}`;
      addLocalizedEntries(entries, seen, settings.siteUrl, sectionPath, {
        changeFrequency: "monthly",
        lastModified,
        priority: 0.78,
      });

      const sectionItemCount = getGuideItemsForSection(city, section.slug).length;
      const totalSectionPages = Math.ceil(sectionItemCount / SECTION_PAGE_SIZE);
      for (let page = 2; page <= totalSectionPages; page += 1) {
        addLocalizedEntries(entries, seen, settings.siteUrl, `${sectionPath}/p/${page}`, {
          changeFrequency: "monthly",
          lastModified,
          priority: 0.65,
        });
      }

      getGuideArticlesForSection(city, section.slug).forEach((article) => {
        addLocalizedEntries(entries, seen, settings.siteUrl, `${sectionPath}/${article.slug}`, {
          changeFrequency: "monthly",
          lastModified,
          priority: 0.72,
        });
      });
    });

    getGuideItems(city).forEach((item) => {
      addLocalizedEntries(entries, seen, settings.siteUrl, pathForGuideItem(city, item), {
        changeFrequency: "monthly",
        lastModified,
        priority: 0.74,
      });
    });

    city.listings.forEach((listing) => {
      addLocalizedEntries(entries, seen, settings.siteUrl, pathForListing(city, listing), {
        changeFrequency: "monthly",
        lastModified: listing.lastVerifiedAt ?? lastModified,
        priority: 0.7,
      });
    });
  }

  return entries;
}
