import type { MetadataRoute } from "next";

import { pathForListing } from "@/lib/city-data";
import { getCityBySlug, getCityNavItems } from "@/lib/city-source";
import {
  getGuideArticlesForSection,
  getGuideItems,
  pathForGuideItem,
  publicSectionCards,
} from "@/lib/guide-items";
import { localizedUrl, type PageLocale } from "@/lib/seo";

type SitemapEntry = MetadataRoute.Sitemap[number];

const alternates = (path: string) => ({
  languages: {
    en: localizedUrl(path, "en"),
    ar: localizedUrl(path, "ar"),
    "x-default": localizedUrl(path, "ar"),
  },
});

const addLocalizedEntries = (
  entries: SitemapEntry[],
  seen: Set<string>,
  path: string,
  options: Omit<SitemapEntry, "url" | "alternates"> = {},
) => {
  (["en", "ar"] satisfies PageLocale[]).forEach((locale) => {
    const url = localizedUrl(path, locale);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({
      url,
      alternates: alternates(path),
      ...options,
    });
  });
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  addLocalizedEntries(entries, seen, "/", {
    changeFrequency: "weekly",
    priority: 1,
  });

  ["/about", "/news", "/travel-articles", "/special-offers"].forEach((path) => {
    addLocalizedEntries(entries, seen, path, {
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

    addLocalizedEntries(entries, seen, cityPath, {
      changeFrequency: "weekly",
      lastModified,
      priority: 0.95,
    });

    ["/islamic-travel", "/itineraries", "/prayer-times"].forEach((suffix) => {
      addLocalizedEntries(entries, seen, `${cityPath}${suffix}`, {
        changeFrequency: "weekly",
        lastModified,
        priority: 0.8,
      });
    });

    city.neighborhoods.forEach((neighborhood) => {
      addLocalizedEntries(entries, seen, `${cityPath}/neighborhood/${neighborhood.slug}`, {
        changeFrequency: "monthly",
        lastModified,
        priority: 0.75,
      });
    });

    publicSectionCards.forEach((section) => {
      const sectionPath = `${cityPath}/section/${section.slug}`;
      addLocalizedEntries(entries, seen, sectionPath, {
        changeFrequency: "monthly",
        lastModified,
        priority: 0.78,
      });

      getGuideArticlesForSection(city, section.slug).forEach((article) => {
        addLocalizedEntries(entries, seen, `${sectionPath}/${article.slug}`, {
          changeFrequency: "monthly",
          lastModified,
          priority: 0.72,
        });
      });
    });

    getGuideItems(city).forEach((item) => {
      addLocalizedEntries(entries, seen, pathForGuideItem(city, item), {
        changeFrequency: "monthly",
        lastModified,
        priority: 0.74,
      });
    });

    city.listings.forEach((listing) => {
      addLocalizedEntries(entries, seen, pathForListing(city, listing), {
        changeFrequency: "monthly",
        lastModified: listing.lastVerifiedAt ?? lastModified,
        priority: 0.7,
      });
    });
  }

  return entries;
}
