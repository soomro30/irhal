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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nestedLocaleMatch = pathname.match(/^\/(ar|en)\/(ar|en)(?=\/|$)/);

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return NextResponse.next();
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
