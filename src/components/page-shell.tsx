import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

import { LocaleDocumentSync } from "@/components/locale-document-sync";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getCityNavItems } from "@/lib/city-source";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export async function PageShell({
  breadcrumbs,
  children,
  locale = "en",
}: {
  breadcrumbs?: BreadcrumbItem[];
  children: React.ReactNode;
  locale?: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const cityItems = await getCityNavItems();

  return (
    <div
      className={`min-h-screen bg-paper text-ink ${isArabic ? "font-arabic" : ""}`}
      dir={isArabic ? "rtl" : "ltr"}
      lang={isArabic ? "ar" : "en"}
    >
      <LocaleDocumentSync locale={locale} />
      <SiteHeader cityItems={cityItems} isArabic={isArabic} key={locale} />
      {breadcrumbs?.length ? (
        <nav
          aria-label={isArabic ? "مسار التنقل" : "Breadcrumb"}
          className="border-b border-ink/10 bg-paper-deep"
        >
          <ol className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-5 py-2.5 text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const showHomeIcon = index === 0;
              const href =
                !isArabic && showHomeIcon && item.href === "/"
                  ? "/en"
                  : item.href;

              return (
                <li
                  className="flex shrink-0 items-center gap-2"
                  key={`${item.label}-${index}`}
                >
                  {index > 0 ? (
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-ink/30 rtl:rotate-180"
                    />
                  ) : null}
                  {href && !isLast ? (
                    <Link
                      className="inline-flex h-8 items-center gap-2 rounded-md px-2 font-semibold text-ink/60 transition hover:bg-white hover:text-irhal-red"
                      href={href}
                    >
                      {showHomeIcon ? (
                        <Home aria-hidden="true" className="h-4 w-4" />
                      ) : null}
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className="inline-flex h-8 items-center gap-2 rounded-md border border-ink/10 bg-white px-2.5 font-bold text-ink shadow-sm"
                    >
                      {showHomeIcon ? (
                        <Home aria-hidden="true" className="h-4 w-4" />
                      ) : null}
                      {item.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
      {children}
      <SiteFooter cityItems={cityItems} isArabic={isArabic} key={`footer-${locale}`} />
    </div>
  );
}
