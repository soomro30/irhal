import Link from "next/link";

import type { CityNavItem } from "@/lib/city-source";

type FooterLink = [string, string];

const socialLinks = ["X", "f", "✉"];

const staticConnectLinks = {
  ar: [
    ["عن إرحل", "/ar/about"],
    ["الإعلان", "/ar"],
    ["سياسة الخصوصية", "/ar"],
    ["شروط الاستخدام", "/ar"],
    ["البيانات الصحفية", "/ar/news"],
    ["اتصل بنا", "/ar"],
  ],
  en: [
    ["About Us", "/en/about"],
    ["Advertise", "/en"],
    ["Privacy Policy", "/en"],
    ["Terms of Use", "/en"],
    ["Press Releases", "/en/news"],
    ["Contact Us", "/en"],
  ],
} satisfies Record<"ar" | "en", FooterLink[]>;

const cityLinkLabel = (
  city: CityNavItem,
  suffix: string,
  isArabic: boolean,
) => {
  if (!isArabic) return `${city.name} ${suffix}`;
  if (city.slug === "karachi") {
    if (suffix === "Travel Guide") return "دليل كراتشي";
    if (suffix === "Shopping") return "تسوق كراتشي";
    if (suffix === "Hotels") return "فنادق كراتشي";
  }
  return `${suffix} ${city.name}`;
};

const cityLinks = (
  cityItems: CityNavItem[],
  section: "destination" | "hotels" | "shopping",
  isArabic: boolean,
): FooterLink[] => {
  const prefix = isArabic ? "/ar" : "/en";
  const suffixBySection = {
    destination: "Travel Guide",
    hotels: "Hotels",
    shopping: "Shopping",
  };
  const pathBySection = {
    destination: "",
    hotels: "/section/hotels",
    shopping: "/section/shopping",
  };

  return cityItems.slice(0, 8).map((city) => [
    cityLinkLabel(city, suffixBySection[section], isArabic),
    `${prefix}/city/${city.slug}${pathBySection[section]}`,
  ]);
};

export function SiteFooter({
  cityItems,
  isArabic,
}: {
  cityItems: CityNavItem[];
  isArabic: boolean;
}) {
  const locale = isArabic ? "ar" : "en";
  const columns: { links: FooterLink[]; title: string }[] = [
    {
      title: isArabic ? "أخبار رائجة" : "Popular News",
      links: [],
    },
    {
      title: isArabic ? "وجهات رائجة" : "Popular Destination",
      links: cityLinks(cityItems, "destination", isArabic),
    },
    {
      title: isArabic ? "التسوق" : "Shopping",
      links: cityLinks(cityItems, "shopping", isArabic),
    },
    {
      title: isArabic ? "الفنادق" : "Hotels",
      links: cityLinks(cityItems, "hotels", isArabic),
    },
    {
      title: isArabic ? "تواصل مع إرحل" : "Connect with Irhal",
      links: staticConnectLinks[locale],
    },
  ];

  return (
    <footer
      className="bg-[#333333] text-white"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <div className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {columns.map((column, columnIndex) => (
            <div key={column.title}>
              <h2 className="text-sm font-black text-white/72">
                {column.title}
              </h2>
              {columnIndex === 4 ? (
                <div className="mt-4 flex gap-2">
                  {socialLinks.map((label) => (
                    <Link
                      aria-label={`${column.title} ${label}`}
                      className="grid h-11 w-11 place-items-center rounded-full bg-white/20 text-lg font-black text-[#333333] transition hover:bg-white"
                      href="/"
                      key={label}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              ) : null}
              <ul className={columnIndex === 4 ? "mt-4 space-y-2.5" : "mt-3 space-y-2.5"}>
                {column.links.map(([label, href]) => (
                  <li key={`${column.title}-${label}`}>
                    <Link
                      className="block truncate text-sm font-bold text-white transition hover:text-irhal-orange"
                      href={href}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-white/10 pt-5">
          <p className="text-sm font-bold text-white/62">
            {isArabic ? "© إرحل 2007 - 2026" : "© Irhal 2007 - 2026"}
          </p>
        </div>
      </div>
    </footer>
  );
}
