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

const withLocaleHeader = (request: NextRequest, locale: "en" | "ar") => {
  const headers = new Headers(request.headers);
  headers.set("x-irhal-locale", locale);
  return headers;
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nestedLocaleMatch = pathname.match(/^\/(ar|en)\/(ar|en)(?=\/|$)/);

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

  if (pathname.startsWith("/en/")) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = pathname.replace(/^\/en/, "") || "/";
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: withLocaleHeader(request, "en") },
    });
  }

  if (isEnglishPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/ar${pathname}`;
    return NextResponse.redirect(redirectUrl, 308);
  }

  const locale = pathname === "/en" ? "en" : "ar";
  return NextResponse.next({
    request: { headers: withLocaleHeader(request, locale) },
  });
}

export const config = {
  matcher: [
    "/((?!api|admin|payload-api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
