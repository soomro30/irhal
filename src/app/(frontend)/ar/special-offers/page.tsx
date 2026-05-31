import type { Metadata } from "next";

import { DiscoverLink } from "@/components/discover-action";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "عروض خاصة | إرحل",
  description:
    "عروض خاصة منتقاة من إرحل للفنادق والجولات والرحلات العائلية وتخطيط السفر المناسب للمسافرين المسلمين.",
  path: "/ar/special-offers",
});

export default async function ArabicSpecialOffersPage() {
  const [city] = await getCityNavItems();
  const citySlug = city?.slug ?? "karachi";

  return (
    <PageShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/ar" },
        { label: "عروض خاصة" },
      ]}
      locale="ar"
    >
      <main className="font-arabic bg-white" dir="rtl">
        <section className="mx-auto max-w-7xl px-5 py-14">
          <Badge variant="red">عروض إرحل</Badge>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
            عروض خاصة
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink/68">
            ستظهر هنا عروض الفنادق والجولات والرحلات العائلية بعد مراجعة الشركاء
            والفريق التحريري.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["الفنادق", `/ar/city/${citySlug}/section/hotels`],
              ["الجولات المنظمة", `/ar/city/${citySlug}/section/organized-tours`],
              ["السفر العائلي", `/ar/city/${citySlug}/section/children-in-tow`],
            ].map(([label, href]) => (
              <Card
                className="border-ink/10 bg-paper shadow-none transition hover:border-irhal-red/45"
                key={label}
              >
                <CardContent className="p-5">
                  <h2 className="text-xl font-black text-ink">{label}</h2>
                  <div className="mt-5">
                    <DiscoverLink href={href} label="اكتشف" />
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
