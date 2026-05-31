import type { Metadata } from "next";

import { SearchPageContent, type SearchPageProps } from "@/app/search/page";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "البحث | إرحل",
  description:
    "ابحث في أدلة إرحل عن المدن والأماكن والفنادق والمطاعم والتسوق والمساجد والمناطق.",
  path: "/ar/search",
  robots: {
    index: false,
    follow: true,
  },
});

export default function ArabicSearchPage({ searchParams }: SearchPageProps) {
  return <SearchPageContent locale="ar" searchParams={searchParams} />;
}
