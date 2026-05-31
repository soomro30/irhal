import type { SearchLocale } from "@/lib/site-search";
import { searchSite } from "@/lib/site-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const localeParam = searchParams.get("locale");
  const locale: SearchLocale = localeParam === "ar" ? "ar" : "en";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 30);

  const results = await searchSite({ query, locale, limit });

  return Response.json({
    query,
    locale,
    results,
  });
}
