import type { Metadata } from "next";

import { DiscoverLink } from "@/components/discover-action";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "مقالات السفر | إرحل",
  description:
    "مقالات سفر من إرحل تشمل معلومات الزائر، والتنقل، والسفر العائلي، والسفر الإسلامي، وتخطيط المدن.",
  path: "/ar/travel-articles",
});

const sections = [
  {
    href: "visitor-information",
    summary: "معلومات عملية عن التأشيرات، والوصول، والطقس، والعملة.",
    title: "معلومات الزائر",
  },
  {
    href: "city-information",
    summary: "خلفية المدينة، وتاريخها، وشخصيتها، وملاحظات التخطيط.",
    title: "معلومات المدينة",
  },
  {
    href: "transportation-and-getting-around",
    summary: "إرشادات المطار، والتنقل داخل المدينة، والتخطيط حسب المناطق.",
    title: "المواصلات",
  },
  {
    href: "children-in-tow",
    summary: "اقتراحات للرحلات العائلية وسرعة الحركة المناسبة للأطفال.",
    title: "السفر مع الأطفال",
  },
  {
    href: "muslim-visitor-information",
    summary: "إرشادات الحلال، والمساجد، وآداب الصلاة أثناء السفر.",
    title: "معلومات للمسافر المسلم",
  },
  {
    href: "health-and-safety",
    summary: "نصائح السلامة، والصحة، والطعام، والطقس أثناء الرحلة.",
    title: "الصحة والسلامة",
  },
];

export default async function ArabicTravelArticlesPage() {
  const [city] = await getCityNavItems();
  const citySlug = city?.slug ?? "karachi";
  const cityName = city?.name ?? "Karachi";

  return (
    <PageShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/ar" },
        { label: "مقالات السفر" },
      ]}
      locale="ar"
    >
      <main className="font-arabic bg-white" dir="rtl">
        <section className="mx-auto max-w-7xl px-5 py-14">
          <Badge variant="red">تحرير إرحل</Badge>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
            مقالات السفر
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/68">
            مقالات عملية لتخطيط الرحلات مع إرحل، من أساسيات الوصول إلى السفر
            العائلي والإرشادات المناسبة للمسافر المسلم.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <Card
                className="border-ink/10 bg-white shadow-none transition hover:border-irhal-red/45"
                key={section.href}
              >
                <CardContent className="p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-irhal-red">
                    {cityName}
                  </p>
                  <h2 className="mt-3 text-xl font-black text-ink">
                    {section.title}
                  </h2>
                  <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-ink/62">
                    {section.summary}
                  </p>
                  <div className="mt-5">
                    <DiscoverLink
                      href={`/ar/city/${citySlug}/section/${section.href}`}
                      label="اكتشف"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
