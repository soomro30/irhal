import type { MetadataRoute } from "next";

import { getSiteSettings } from "@/lib/site-settings";

const absoluteFromOrigin = (origin: string, path: string) =>
  new URL(path, origin).toString();

export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/payload-api/", "/api/"],
    },
    sitemap: absoluteFromOrigin(settings.siteUrl, "/sitemap.xml"),
    host: settings.siteUrl,
  };
}
