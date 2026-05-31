import type { Metadata } from "next";

import { HomeContent, homeMetadata } from "@/app/page";

export function generateMetadata(): Metadata {
  return homeMetadata("ar");
}

export default function ArabicHome() {
  return <HomeContent locale="ar" />;
}
