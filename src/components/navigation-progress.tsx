"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

function isModifiedClick(event: MouseEvent) {
  return (
    event.altKey ||
    event.button !== 0 ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

function getSameOriginNavigationUrl(event: MouseEvent) {
  if (event.defaultPrevented || isModifiedClick(event)) {
    return null;
  }

  const link =
    event.target instanceof Element ? event.target.closest("a[href]") : null;

  if (!(link instanceof HTMLAnchorElement)) {
    return null;
  }

  if (link.hasAttribute("download") || (link.target && link.target !== "_self")) {
    return null;
  }

  const href = link.getAttribute("href");

  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return null;
  }

  const url = new URL(link.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return null;
  }

  if (url.pathname === window.location.pathname && url.search === window.location.search) {
    return null;
  }

  return url;
}

export function NavigationProgress() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!getSameOriginNavigationUrl(event)) {
        return;
      }

      window.clearTimeout(timeoutRef.current);
      setPending(true);
      timeoutRef.current = window.setTimeout(() => setPending(false), 8000);
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      window.clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    const frame = window.requestAnimationFrame(() => setPending(false));

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-irhal-red shadow-[0_0_12px_rgba(223,23,24,0.35)] transition-transform duration-200 ${
        pending ? "scale-x-100" : "scale-x-0"
      }`}
    />
  );
}
