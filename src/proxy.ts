import { NextResponse, type NextRequest } from "next/server";

const englishPublicPaths = [
  "/about",
  "/city",
  "/news",
  "/search",
  "/special-offers",
  "/travel-articles",
];

const isEnglishPublicPath = (pathname: string) =>
  englishPublicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

const canonicalInformationPaths: Record<string, string> = {
  "/ar/city/london/place/london-history":
    "/ar/city/london/section/city-information/city-back-then",
  "/ar/city/london/place/london-today":
    "/ar/city/london/section/city-information/city-today",
  "/ar/city/london/place/london-currency-and-exchange-rates":
    "/ar/city/london/section/visitor-information/exchange-rates",
  "/ar/city/london/place/london-fast-facts":
    "/ar/city/london/section/visitor-information/fast-facts",
  "/ar/city/london/place/driving-tips-for-london":
    "/ar/city/london/section/transportation-and-getting-around/driving-tips",
  "/ar/city/london/place/london-buses":
    "/ar/city/london/section/transportation-and-getting-around/buses",
  "/ar/city/london/place/london-public-holidays":
    "/ar/city/london/section/visitor-information/public-holidays-england-and-wales-2026",
  "/ar/city/london/place/london-taxis":
    "/ar/city/london/section/transportation-and-getting-around/taxis-and-ride-hailing",
  "/ar/city/london/place/london-underground-tube":
    "/ar/city/london/section/transportation-and-getting-around/underground-and-elizabeth-line",
  "/ar/city/london/place/london-visa-information":
    "/ar/city/london/section/visitor-information/visa-and-eta-information",
  "/ar/city/london/place/london-weather-and-annual-temperature":
    "/ar/city/london/section/visitor-information/annual-temperature-and-rainfall",
  "/ar/city/london/place/when-to-go-to-london":
    "/ar/city/london/section/visitor-information/when-to-go",
  "/en/city/london/place/london-history":
    "/en/city/london/section/city-information/city-back-then",
  "/en/city/london/place/london-today":
    "/en/city/london/section/city-information/city-today",
  "/en/city/london/place/london-currency-and-exchange-rates":
    "/en/city/london/section/visitor-information/exchange-rates",
  "/en/city/london/place/london-fast-facts":
    "/en/city/london/section/visitor-information/fast-facts",
  "/en/city/london/place/driving-tips-for-london":
    "/en/city/london/section/transportation-and-getting-around/driving-tips",
  "/en/city/london/place/london-buses":
    "/en/city/london/section/transportation-and-getting-around/buses",
  "/en/city/london/place/london-public-holidays":
    "/en/city/london/section/visitor-information/public-holidays-england-and-wales-2026",
  "/en/city/london/place/london-taxis":
    "/en/city/london/section/transportation-and-getting-around/taxis-and-ride-hailing",
  "/en/city/london/place/london-underground-tube":
    "/en/city/london/section/transportation-and-getting-around/underground-and-elizabeth-line",
  "/en/city/london/place/london-visa-information":
    "/en/city/london/section/visitor-information/visa-and-eta-information",
  "/en/city/london/place/london-weather-and-annual-temperature":
    "/en/city/london/section/visitor-information/annual-temperature-and-rainfall",
  "/en/city/london/place/when-to-go-to-london":
    "/en/city/london/section/visitor-information/when-to-go",
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nestedLocaleMatch = pathname.match(/^\/(ar|en)\/(ar|en)(?=\/|$)/);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
  }

  const canonicalInformationPath = canonicalInformationPaths[pathname];
  if (canonicalInformationPath) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = canonicalInformationPath;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (nestedLocaleMatch) {
    const [, , innerLocale] = nestedLocaleMatch;
    const redirectUrl = request.nextUrl.clone();
    const restPath = pathname.replace(/^\/(?:ar|en)\/(?:ar|en)/, "") || "/";
    redirectUrl.pathname =
      innerLocale === "en"
        ? restPath === "/"
          ? "/en"
          : `/en${restPath}`
        : restPath === "/"
          ? "/"
          : `/ar${restPath}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (pathname === "/ar") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    return NextResponse.redirect(redirectUrl, 308);
  }

  if (isEnglishPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|payload-api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
