import type { Metadata } from "next";

import { HomeContent, homeMetadata } from "@/app/page";

export function generateMetadata(): Metadata {
  return homeMetadata("en");
}

export default function EnglishHome() {
  return <HomeContent locale="en" />;
}
