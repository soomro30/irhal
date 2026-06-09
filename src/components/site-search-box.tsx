"use client";

import { LoaderCircle, MapPin, Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { SearchLocale, SiteSearchResult } from "@/lib/site-search";
import { cn } from "@/lib/utils";

type SiteSearchBoxProps = {
  className?: string;
  initialQuery?: string;
  locale?: SearchLocale;
  placeholder: string;
  searchLabel: string;
};

type SearchResponse = {
  results: SiteSearchResult[];
};

const emptyResults: SiteSearchResult[] = [];
const minimumQueryLength = 2;
const searchDebounceMs = 260;
const searchTimeoutMs = 4_000;

export function SiteSearchBox({
  className,
  initialQuery = "",
  locale = "en",
  placeholder,
  searchLabel,
}: SiteSearchBoxProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SiteSearchResult[]>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchPath = locale === "ar" ? "/ar/search" : "/search";
  const dir = locale === "ar" ? "rtl" : "ltr";
  const trimmedQuery = query.trim();

  const endpoint = useMemo(() => {
    const params = new URLSearchParams({
      limit: "8",
      locale,
      q: trimmedQuery,
    });
    return `/api/search?${params.toString()}`;
  }, [locale, trimmedQuery]);

  useEffect(() => {
    if (trimmedQuery.length < minimumQueryLength) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), searchTimeoutMs);
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(endpoint, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const payload = (await response.json()) as SearchResponse;
        setResults(payload.results);
        setActiveIndex(0);
      } catch {
        if (!controller.signal.aborted) setResults(emptyResults);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, searchDebounceMs);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
      window.clearTimeout(timer);
    };
  }, [endpoint, trimmedQuery]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const goToResult = (result: SiteSearchResult) => {
    setIsOpen(false);
    router.push(result.href);
  };

  const submitSearch = () => {
    if (trimmedQuery) {
      router.push(`${searchPath}?q=${encodeURIComponent(trimmedQuery)}`);
      setIsOpen(false);
      return;
    }

    router.push(searchPath);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative", className)} dir={dir} ref={wrapperRef}>
      <div className="rounded-full bg-white p-1.5 shadow-2xl">
        <div className="flex min-h-12 items-center gap-3">
          <Search aria-hidden="true" className="ms-3 h-5 w-5 shrink-0 text-ink/55" />
          <input
            aria-autocomplete="list"
            aria-controls="site-search-results"
            aria-expanded={isOpen}
            aria-label={placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-ink outline-none placeholder:text-ink/55"
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              if (nextQuery.trim().length < minimumQueryLength) {
                setResults(emptyResults);
                setActiveIndex(0);
                setIsLoading(false);
              }
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setIsOpen(true);
                setActiveIndex((current) =>
                  Math.min(current + 1, Math.max(results.length - 1, 0)),
                );
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                if (isOpen && results[activeIndex]) {
                  goToResult(results[activeIndex]);
                } else {
                  submitSearch();
                }
              }
              if (event.key === "Escape") setIsOpen(false);
            }}
            placeholder={placeholder}
            role="combobox"
            type="search"
            value={query}
          />
          <Button
            className="rounded-full bg-[#0b74f0] px-8 text-base hover:bg-irhal-red"
            onClick={submitSearch}
            size="lg"
            type="button"
          >
            {isLoading ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            ) : null}
            {searchLabel}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <div
          className="absolute left-0 right-0 top-[calc(100%+0.65rem)] z-30 overflow-hidden rounded-2xl border border-ink/10 bg-white text-ink shadow-2xl"
          id="site-search-results"
        >
          {results.length > 0 ? (
            <ul className="max-h-[420px] overflow-y-auto p-2">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl p-2 text-start transition",
                      index === activeIndex ? "bg-paper-deep" : "hover:bg-paper-deep",
                    )}
                    onMouseEnter={() => setActiveIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => goToResult(result)}
                    type="button"
                  >
                    <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper-deep text-irhal-red">
                      {result.image ? (
                        <Image
                          alt=""
                          className="object-cover"
                          fill
                          sizes="48px"
                          src={result.image}
                        />
                      ) : (
                        <MapPin aria-hidden="true" className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-travel-navy">
                        {result.title}
                      </span>
                      <span className="mt-0.5 block truncate text-xs font-bold text-ink/55">
                        {result.subtitle}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-irhal-red/10 px-2.5 py-1 text-[11px] font-black text-irhal-red">
                      {result.label}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-5 text-sm font-bold text-ink/60">
              {trimmedQuery.length >= minimumQueryLength
                ? locale === "ar"
                  ? "لا توجد نتائج مطابقة بعد."
                  : "No matching results yet."
                : trimmedQuery
                  ? locale === "ar"
                    ? "أكمل كتابة حرف آخر للبحث."
                    : "Keep typing to search."
                : locale === "ar"
                  ? "اكتب اسم مدينة أو مكان للبحث."
                  : "Type a city or place to search."}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
