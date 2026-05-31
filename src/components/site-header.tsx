"use client";

import { ChevronDown, Globe, MapPin, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CityNavItem } from "@/lib/city-source";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  cityItems: CityNavItem[];
  isArabic: boolean;
};

const navLinkClass =
  "relative inline-flex h-9 items-center whitespace-nowrap text-sm font-extrabold text-ink transition-colors hover:text-irhal-red after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-irhal-red after:transition-all after:duration-200 hover:after:w-full rtl:after:left-auto rtl:after:right-0";

export function SiteHeader({ cityItems, isArabic }: SiteHeaderProps) {
  const pathname = usePathname() || "/";

  const homeHref = isArabic ? "/ar" : "/en";
  const newsHref = isArabic ? "/ar/news" : "/news";
  const localePrefix = isArabic ? "/ar" : "/en";
  const primaryCitySlug = cityItems[0]?.slug ?? "karachi";
  const primaryCityHref = `${localePrefix}/city/${primaryCitySlug}`;
  const islamicTravelHref = `${primaryCityHref}/islamic-travel`;
  const specialOffersHref = `${localePrefix}/special-offers`;
  const travelArticlesHref = `${localePrefix}/travel-articles`;

  const toggleHref = isArabic
    ? pathname === "/" || pathname === "/ar"
      ? "/en"
      : pathname.replace(/^\/ar/, "") || "/en"
    : pathname === "/en"
      ? "/ar"
      : `/ar${pathname}`;

  const labels = isArabic
    ? {
        cityGuides: "أدلة المدن",
        home: "الرئيسية",
        language: "EN",
        login: "تسجيل الدخول",
        menu: "القائمة",
        news: "الأخبار",
        islamicTravel: "السفر الإسلامي",
        specialOffers: "عروض خاصة",
        travelArticles: "مقالات السفر",
      }
    : {
        cityGuides: "City Guides",
        home: "Home",
        language: "العربية",
        login: "Login / Sign in",
        menu: "Menu",
        news: "News",
        islamicTravel: "Islamic Travel",
        specialOffers: "Special offers",
        travelArticles: "Travel Articles",
      };

  return (
    <header className="sticky top-0 z-40 border-b border-ink/15 bg-white shadow-sm shadow-ink/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-7">
          <Link
            aria-label="Irhal"
            className="inline-flex items-center"
            href={homeHref}
          >
            <span className="inline-flex items-center rounded-xl bg-irhal-red px-3 py-2 shadow-sm transition-shadow hover:shadow-md">
              <Image
                alt="Irhal"
                className="h-5 w-auto"
                height={116}
                priority
                src="/images/irhal-splash-logo.png"
                width={447}
              />
            </span>
          </Link>

          <nav className="hidden items-center gap-5 xl:flex">
            <Link className={navLinkClass} href={homeHref}>
              {labels.home}
            </Link>
            <CityGuidesMenu
              cityItems={cityItems}
              isArabic={isArabic}
              label={labels.cityGuides}
            />
            <Link className={navLinkClass} href={newsHref}>
              {labels.news}
            </Link>
            <Link className={navLinkClass} href={islamicTravelHref}>
              {labels.islamicTravel}
            </Link>
            <Link className={navLinkClass} href={travelArticlesHref}>
              {labels.travelArticles}
            </Link>
            <Link className={navLinkClass} href={specialOffersHref}>
              {labels.specialOffers}
            </Link>
          </nav>
        </div>

        <div className="hidden items-center gap-3 xl:flex">
          <Link
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/20 px-3.5 text-xs font-extrabold text-ink transition hover:border-ink/45 hover:text-irhal-red"
            href={toggleHref}
          >
            <Globe aria-hidden="true" className="h-4 w-4" />
            {labels.language}
          </Link>
          <Button asChild size="sm" variant="outline">
            <Link href="/admin">{labels.login}</Link>
          </Button>
        </div>

        <div className="xl:hidden">
          <MobileNav
            cityItems={cityItems}
            homeHref={homeHref}
            islamicTravelHref={islamicTravelHref}
            isArabic={isArabic}
            labels={labels}
            localePrefix={localePrefix}
            newsHref={newsHref}
            specialOffersHref={specialOffersHref}
            toggleHref={toggleHref}
            travelArticlesHref={travelArticlesHref}
          />
        </div>
      </div>
    </header>
  );
}

function CityGuidesMenu({
  cityItems,
  isArabic,
  label,
}: {
  cityItems: CityNavItem[];
  isArabic: boolean;
  label: string;
}) {
  const localePrefix = isArabic ? "/ar" : "/en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(navLinkClass, "gap-1.5 outline-none group")}
          type="button"
        >
          {label}
          <ChevronDown
            aria-hidden="true"
            className="h-4 w-4 opacity-70 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isArabic ? "end" : "start"} className="w-72">
        <DropdownMenuLabel className="uppercase tracking-[0.14em]">
          {label}
        </DropdownMenuLabel>
        {cityItems.map((city) => (
          <DropdownMenuItem asChild key={city.slug}>
            <Link href={`${localePrefix}/city/${city.slug}`}>
              <span className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-irhal-red/10 text-irhal-red">
                  <MapPin aria-hidden="true" className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-extrabold text-ink">
                    {city.name}
                  </span>
                  {city.country ? (
                    <span className="mt-0.5 block text-xs font-semibold text-ink/55">
                      {city.country}
                    </span>
                  ) : null}
                </span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileNav({
  cityItems,
  homeHref,
  islamicTravelHref,
  isArabic,
  labels,
  localePrefix,
  newsHref,
  specialOffersHref,
  toggleHref,
  travelArticlesHref,
}: {
  cityItems: CityNavItem[];
  homeHref: string;
  islamicTravelHref: string;
  isArabic: boolean;
  labels: {
    cityGuides: string;
    home: string;
    islamicTravel: string;
    language: string;
    login: string;
    menu: string;
    news: string;
    specialOffers: string;
    travelArticles: string;
  };
  localePrefix: string;
  newsHref: string;
  specialOffersHref: string;
  toggleHref: string;
  travelArticlesHref: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label={labels.menu}
          className="text-ink"
          size="icon"
          variant="ghost"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isArabic ? "start" : "end"}
        className="w-64"
      >
        <DropdownMenuItem asChild>
          <Link href={homeHref}>{labels.home}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={newsHref}>{labels.news}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={islamicTravelHref}>{labels.islamicTravel}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={travelArticlesHref}>{labels.travelArticles}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={specialOffersHref}>{labels.specialOffers}</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="uppercase tracking-[0.14em]">
          {labels.cityGuides}
        </DropdownMenuLabel>
        {cityItems.map((city) => (
          <DropdownMenuItem asChild key={city.slug}>
            <Link href={`${localePrefix}/city/${city.slug}`}>
              <span className="flex items-center gap-2">
                <MapPin aria-hidden="true" className="h-4 w-4 text-irhal-red" />
                {city.name}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin">{labels.login}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={toggleHref}>
            <span className="flex items-center gap-2">
              <Globe aria-hidden="true" className="h-4 w-4" />
              {labels.language}
            </span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
