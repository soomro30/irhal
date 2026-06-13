import config from "@/payload.config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";
import { cache } from "react";

type CMSDoc = Record<string, unknown>;

export type GuideCardSortMode =
  | "media"
  | "more-description"
  | "recent-update"
  | "name";

export type PublicSiteSettings = {
  analyticsEnabled: boolean;
  bingSiteVerification?: string;
  cookieConsentRequired: boolean;
  defaultOpenGraphImageUrl?: string;
  defaultSeoDescription: string;
  defaultSeoTitle: string;
  ga4MeasurementId?: string;
  googleSiteVerification?: string;
  googleTagManagerId?: string;
  guideCardSortMode: GuideCardSortMode;
  organizationLogoUrl?: string;
  organizationName: string;
  organizationUrl: string;
  pinterestVerification?: string;
  sameAs: string[];
  siteName: string;
  siteUrl: string;
  yandexVerification?: string;
};

const defaultSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const fallbackSettings = (): PublicSiteSettings => {
  const url = defaultSiteUrl();

  return {
    analyticsEnabled: false,
    cookieConsentRequired: false,
    defaultSeoDescription:
      "Muslim-friendly city guides with maps, halal-aware planning, local areas, and practical travel essentials.",
    defaultSeoTitle: "Irhal AI Travel",
    guideCardSortMode: "media",
    organizationName: "Irhal",
    organizationUrl: url,
    sameAs: [],
    siteName: "Irhal",
    siteUrl: url,
  };
};

const isCMSConfigured = () =>
  Boolean(
    process.env.DATABASE_URL &&
      !process.env.DATABASE_URL.includes("<") &&
      process.env.PAYLOAD_SECRET,
  );

const siteSettingsCacheTtlSeconds =
  process.env.NODE_ENV === "development" ? 5 : 60 * 60 * 24;

const asRecord = (value: unknown): CMSDoc =>
  value && typeof value === "object" ? (value as CMSDoc) : {};

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const asBoolean = (value: unknown) => value === true;

const normalizeUrl = (value: unknown, fallback: string) => {
  const raw = asString(value) || fallback;

  try {
    return new URL(raw).toString().replace(/\/$/, "");
  } catch {
    return fallback.replace(/\/$/, "");
  }
};

const mediaUrl = (value: unknown) => {
  const media = asRecord(value);
  const sizes = asRecord(media.sizes);
  const hero = asRecord(sizes.hero);
  const card = asRecord(sizes.card);
  return asString(media.url) || asString(hero.url) || asString(card.url);
};

const validGa4Id = (value: unknown) => {
  const id = asString(value).toUpperCase();
  return /^G-[A-Z0-9]+$/.test(id) ? id : undefined;
};

const validGtmId = (value: unknown) => {
  const id = asString(value).toUpperCase();
  return /^GTM-[A-Z0-9]+$/.test(id) ? id : undefined;
};

const sameAsUrls = (value: unknown) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => asString(asRecord(entry).url))
    .filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" || parsed.protocol === "http:";
      } catch {
        return false;
      }
    });

const normalizeGuideCardSortMode = (value: unknown): GuideCardSortMode => {
  const mode = asString(value);
  return mode === "name" ||
    mode === "recent-update" ||
    mode === "more-description" ||
    mode === "media"
    ? mode
    : "media";
};

const normalizeSiteSettings = (doc: CMSDoc): PublicSiteSettings => {
  const fallback = fallbackSettings();
  const siteUrl = normalizeUrl(doc.siteUrl, fallback.siteUrl);
  const organizationUrl = normalizeUrl(doc.organizationUrl, siteUrl);
  const analyticsEnabled = asBoolean(doc.analyticsEnabled);

  return {
    analyticsEnabled,
    bingSiteVerification: asString(doc.bingSiteVerification) || undefined,
    cookieConsentRequired: asBoolean(doc.cookieConsentRequired),
    defaultOpenGraphImageUrl: mediaUrl(doc.defaultOpenGraphImage) || undefined,
    defaultSeoDescription:
      asString(doc.defaultSeoDescription) || fallback.defaultSeoDescription,
    defaultSeoTitle: asString(doc.defaultSeoTitle) || fallback.defaultSeoTitle,
    ga4MeasurementId: analyticsEnabled ? validGa4Id(doc.ga4MeasurementId) : undefined,
    googleSiteVerification: asString(doc.googleSiteVerification) || undefined,
    googleTagManagerId: analyticsEnabled
      ? validGtmId(doc.googleTagManagerId)
      : undefined,
    guideCardSortMode: normalizeGuideCardSortMode(doc.guideCardSortMode),
    organizationLogoUrl: mediaUrl(doc.organizationLogo) || undefined,
    organizationName: asString(doc.organizationName) || asString(doc.siteName) || "Irhal",
    organizationUrl,
    pinterestVerification: asString(doc.pinterestVerification) || undefined,
    sameAs: sameAsUrls(doc.sameAs),
    siteName: asString(doc.siteName) || fallback.siteName,
    siteUrl,
    yandexVerification: asString(doc.yandexVerification) || undefined,
  };
};

const loadSiteSettings = async (): Promise<PublicSiteSettings> => {
  if (!isCMSConfigured()) {
    return fallbackSettings();
  }

  try {
    const payload = await getPayload({ config });
    const settings = (await payload.findGlobal({
      slug: "site-settings" as never,
      depth: 2,
      overrideAccess: true,
    })) as CMSDoc;

    return normalizeSiteSettings(settings);
  } catch (error) {
    console.error("Payload site settings source failed.", error);
    return fallbackSettings();
  }
};

const cachedLoadSiteSettings = unstable_cache(
  loadSiteSettings,
  ["irhal-site-settings-v1"],
  {
    revalidate: siteSettingsCacheTtlSeconds,
    tags: ["irhal-site-settings"],
  },
);

const requestCachedLoadSiteSettings = cache(cachedLoadSiteSettings);

export const getSiteSettings = async () => requestCachedLoadSiteSettings();

export const organizationJsonLd = (settings: PublicSiteSettings) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: settings.organizationName,
  url: settings.organizationUrl,
  ...(settings.organizationLogoUrl ? { logo: settings.organizationLogoUrl } : {}),
  ...(settings.sameAs.length > 0 ? { sameAs: settings.sameAs } : {}),
});
