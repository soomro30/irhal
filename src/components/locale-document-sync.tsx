"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

type Locale = "en" | "ar";

function localeFromPathname(pathname: string): Locale {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return "en";

  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "ar";
}

function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
}

export function LocaleDocumentSync({ locale }: { locale: Locale }) {
  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  return null;
}

export function LocaleRouteSync() {
  const pathname = usePathname();

  useEffect(() => {
    applyDocumentLocale(localeFromPathname(window.location.pathname));
  }, [pathname]);

  useEffect(() => {
    const syncFromUrl = (url: URL) => {
      if (url.origin === window.location.origin) {
        applyDocumentLocale(localeFromPathname(url.pathname));
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      const link =
        event.target instanceof Element ? event.target.closest("a[href]") : null;

      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) {
        return;
      }

      const href = link.getAttribute("href");

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      syncFromUrl(new URL(link.href, window.location.href));
    };

    const handlePopState = () => {
      applyDocumentLocale(localeFromPathname(window.location.pathname));
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return null;
}
