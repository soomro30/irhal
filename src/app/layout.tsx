import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import { NavigationProgress } from "@/components/navigation-progress";
import "./globals.css";

const tripSans = localFont({
  src: [
    {
      path: "../../public/fonts/Trip-Sans-Font/trip-sans.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Trip-Sans-Font/trip-sans-medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Trip-Sans-Font/trip-sans-bold.otf",
      weight: "700 800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Trip-Sans-Font/trip-sans-ultra.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-trip-sans",
  display: "swap",
  fallback: ["Arial", "Helvetica", "sans-serif"],
});

const tripSansMono = localFont({
  src: "../../public/fonts/Trip-Sans-Font/trip-sans-mono-regular.otf",
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["Menlo", "Consolas", "monospace"],
});

const cairo = localFont({
  src: [
    { path: "../../public/fonts/arabic/cairo-400.ttf", weight: "400", style: "normal" },
    { path: "../../public/fonts/arabic/cairo-500.ttf", weight: "500", style: "normal" },
    { path: "../../public/fonts/arabic/cairo-600.ttf", weight: "600", style: "normal" },
    { path: "../../public/fonts/arabic/cairo-700.ttf", weight: "700", style: "normal" },
    { path: "../../public/fonts/arabic/cairo-800.ttf", weight: "800", style: "normal" },
    { path: "../../public/fonts/arabic/cairo-900.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-cairo",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

const notoSansArabic = localFont({
  src: [
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-400.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-500.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-800.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/arabic/noto-sans-arabic-900.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-noto-arabic",
  display: "swap",
  fallback: ["Tahoma", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Irhal AI Travel",
    template: "%s | Irhal AI Travel",
  },
  description: "Muslim-friendly city guides with maps, halal-aware planning, local areas, and practical travel essentials.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-irhal-locale") === "en" ? "en" : "ar";

  return (
    <html
      dir={locale === "ar" ? "rtl" : "ltr"}
      lang={locale}
      className={`${tripSans.variable} ${tripSansMono.variable} ${cairo.variable} ${notoSansArabic.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <NavigationProgress />
        {children}
      </body>
    </html>
  );
}
