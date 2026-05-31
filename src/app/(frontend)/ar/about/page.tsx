import { Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CityImageCard } from "@/components/city-image-card";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityNavItems } from "@/lib/city-source";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "عن إرحل | Irhal",
  description:
    "قصة إرحل، دليل سفر موجه للمسافرين من الشرق الأوسط.",
  path: "/ar/about",
});

const aboutParagraphs = [
  "عند عبور نهر تشارلز من كلية هارفارد للأعمال والسير قرب مدرسة جون ف. كينيدي للحكم باتجاه ساحة هارفارد، لفتتني لافتة غريبة على نافذة أحد المتاجر تقول: \"Please Go Away.\" وعندما اقتربت منها وجدت أن العبارة تكتمل بكلمة \"Often.\"",
  "\"Please Go Away ... Often.\" شعار مناسب لوكالة سفر. ومن هنا جاءت فكرة \"irhal.com\".",
  "إرحل كلمة عربية تعني الانطلاق أو السفر بعيدًا. قد تبدو العبارة حادة إذا تُرجمت حرفيًا، لكن سحر السفر يظهر حين تصبح الدعوة إلى الرحيل متكررة ومليئة بالاكتشاف. اختصر الاسم ليكون قصيرًا وسهل التذكر، بينما يظل هدف الموقع هو الاحتفاء بسحر السفر.",
  "كلما اتجهت إلى وجهة لا تعرفها، تحتاج إلى دليل. يريد إرحل أن يكون ذلك الدليل. وبعد أن تزور المكان وتختبره، نأمل أن تشارك تعليقاتك وصورك حتى تساعد تجربتك مسافرين آخرين.",
  "هذا الموقع موجه للمسافرين المنطلقين من الشرق الأوسط. في كل صيف يغادر كثير من المقيمين وأهل المنطقة بحثًا عن وجهات جديدة؛ بعضهم يسافر مع عائلته، وبعضهم يحمل حقيبة خفيفة وروح مغامرة. يخدم إرحل الجميع، من أدلة المدن وما يناسب الأطفال، إلى مواقيت الصلاة ومواقع المساجد ومطاعم الطعام الحلال لمن يريد خيارات أوسع من المأكولات البحرية والسلطات.",
  "سيبقى إرحل مشروعًا يتطور باستمرار: مدن جديدة، وطرق جديدة لاكتشاف الموضة الراقية والمطابخ المحلية، ومعلومات صغيرة تساعد من سيتبع خطواتك.",
  "إرحل. كثيرًا. من فضلك!",
];

const orderedCities = (cities: Awaited<ReturnType<typeof getCityNavItems>>) =>
  [...cities].sort((a, b) => a.slug.localeCompare(b.slug)).slice(0, 10);

export default async function ArabicAboutPage() {
  const cities = orderedCities(await getCityNavItems());

  return (
    <PageShell
      breadcrumbs={[
        { label: "الرئيسية", href: "/ar" },
        { label: "عن إرحل" },
      ]}
      locale="ar"
    >
      <main className="bg-white" dir="rtl">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article>
            <Badge variant="red">إرحل</Badge>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-ink">
              عن إرحل
            </h1>
            <div className="mt-8 space-y-7 text-lg leading-9 text-ink/78">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <Card className="overflow-hidden border-ink/10 bg-white shadow-none">
              <CardContent className="p-5">
                <Image
                  alt="معاينة تطبيق إرحل للهواتف الذكية"
                  className="mx-auto h-auto w-full max-w-[300px]"
                  height={337}
                  priority
                  src="/images/irhal_app.png"
                  width={367}
                />
              </CardContent>
            </Card>

            <section aria-labelledby="about-city-cards-ar">
              <div className="flex items-center gap-2">
                <Shuffle aria-hidden="true" className="h-5 w-5 text-irhal-red" />
                <h2 className="text-lg font-black text-ink" id="about-city-cards-ar">
                  استكشف العالم
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-ink/60">
                اختر دليل مدينة وابدأ التخطيط مع إرحل.
              </p>
              <div className="mt-5 grid gap-4">
                {cities.map((city) => {
                  const cityName = city.slug === "karachi" ? "كراتشي" : city.name;
                  const countryName = city.slug === "karachi" ? "باكستان" : city.country;
                  return (
                    <CityImageCard
                      city={{ ...city, name: cityName }}
                      countryName={countryName}
                      href={`/ar/city/${city.slug}`}
                      key={city.slug}
                    />
                  );
                })}
              </div>
            </section>

            <Card className="border-0 bg-ink text-white shadow-none">
              <CardContent className="p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-irhal-orange">
                  أدوات إرحل للسفر
                </p>
                <div className="mt-4 grid gap-2">
                  {[
                    ["مواقيت الصلاة", "/ar/city/karachi/prayer-times"],
                    ["السفر الإسلامي", "/ar/city/karachi/islamic-travel"],
                    ["السفر مع الأطفال", "/ar/city/karachi/section/children-in-tow"],
                    ["الفنادق", "/ar/city/karachi/section/hotels"],
                  ].map(([label, href]) => (
                    <Link
                      className="rounded-md px-3 py-2 text-sm font-bold text-white/78 transition hover:bg-white/10 hover:text-white"
                      href={href}
                      key={label}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}
