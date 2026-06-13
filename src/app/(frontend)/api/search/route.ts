import type { SearchLocale } from "@/lib/site-search";
import { searchSite } from "@/lib/site-search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const citySlug = (searchParams.get("city") ?? "").trim() || undefined;
  const localeParam = searchParams.get("locale");
  const locale: SearchLocale = localeParam === "ar" ? "ar" : "en";
  const limit = Math.min(Number(searchParams.get("limit") ?? 8) || 8, 30);

  if (query.length < 2) {
    return Response.json(
      {
        query,
        locale,
        results: [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  }

  try {
    const results = await searchSite({ citySlug, query, locale, limit });

    return Response.json(
      {
        city: citySlug,
        query,
        locale,
        results,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("Search API failed", error);
    return Response.json(
      {
        query,
        locale,
        results: [],
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
