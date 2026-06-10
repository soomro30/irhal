import type { Metadata } from "next";
import localFont from "next/font/local";

import {
  GoogleTagManagerNoScript,
  SiteAnalytics,
} from "@/components/site-analytics";
import { JsonLd } from "@/components/json-ld";
import { LocaleRouteSync } from "@/components/locale-document-sync";
import { NavigationProgress } from "@/components/navigation-progress";
import { getSiteSettings, organizationJsonLd } from "@/lib/site-settings";
import "../globals.css";

export const revalidate = 86400;

const tripSans = localFont({
  preload: false,
  src: [
    {
      path: "../../../public/fonts/Trip-Sans-Font/trip-sans.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Trip-Sans-Font/trip-sans-medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Trip-Sans-Font/trip-sans-bold.otf",
      weight: "700 800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/Trip-Sans-Font/trip-sans-ultra.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-trip-sans",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const tripSansMono = localFont({
  preload: false,
  src: "../../../public/fonts/Trip-Sans-Font/trip-sans-mono-regular.otf",
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["Menlo", "Consolas", "monospace"],
});

const cairo = localFont({
  preload: false,
  src: [
    { path: "../../../public/fonts/arabic/cairo-400.ttf", weight: "400", style: "normal" },
    { path: "../../../public/fonts/arabic/cairo-500.ttf", weight: "500", style: "normal" },
    { path: "../../../public/fonts/arabic/cairo-600.ttf", weight: "600", style: "normal" },
    { path: "../../../public/fonts/arabic/cairo-700.ttf", weight: "700", style: "normal" },
    { path: "../../../public/fonts/arabic/cairo-800.ttf", weight: "800", style: "normal" },
    { path: "../../../public/fonts/arabic/cairo-900.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const notoSansArabic = localFont({
  preload: false,
  src: [
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-800.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../../public/fonts/arabic/noto-sans-arabic-900.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-noto-arabic",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const verificationOther: Record<string, string> = {};

  if (settings.bingSiteVerification) {
    verificationOther["msvalidate.01"] = settings.bingSiteVerification;
  }
  if (settings.pinterestVerification) {
    verificationOther["p:domain_verify"] = settings.pinterestVerification;
  }

  return {
    metadataBase: new URL(settings.siteUrl),
    title: {
      default: settings.defaultSeoTitle,
      template: "%s",
    },
    description: settings.defaultSeoDescription,
    ...(settings.defaultOpenGraphImageUrl
      ? {
          openGraph: {
            images: [settings.defaultOpenGraphImageUrl],
            siteName: settings.siteName,
          },
          twitter: {
            card: "summary_large_image",
            images: [settings.defaultOpenGraphImageUrl],
          },
        }
      : {
          openGraph: {
            siteName: settings.siteName,
          },
        }),
    verification: {
      ...(settings.googleSiteVerification
        ? { google: settings.googleSiteVerification }
        : {}),
      ...(settings.yandexVerification ? { yandex: settings.yandexVerification } : {}),
      ...(Object.keys(verificationOther).length > 0
        ? { other: verificationOther }
        : {}),
    },
  };
}

export default async function EnglishRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html
      dir="ltr"
      lang="en"
      className={`${tripSans.variable} ${tripSansMono.variable} ${cairo.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <GoogleTagManagerNoScript settings={settings} />
        <LocaleRouteSync />
        <NavigationProgress />
        {children}
        <SiteAnalytics settings={settings} />
        <JsonLd data={organizationJsonLd(settings)} />
      </body>
    </html>
  );
}
