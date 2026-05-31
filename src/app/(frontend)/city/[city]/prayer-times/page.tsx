import { CalendarDays, Clock3, Compass, MapPin, MoonStar } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/json-ld";
import { PageShell } from "@/components/page-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCityBySlug } from "@/lib/city-source";
import {
  getPrayerTimesForCity,
  type PrayerKey,
  type PrayerTime,
} from "@/lib/prayer-times";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ city: string }>;
};

type PageLocale = "en" | "ar";

const prayerName: Record<PageLocale, Record<PrayerKey, string>> = {
  ar: {
    Asr: "العصر",
    Dhuhr: "الظهر",
    Fajr: "الفجر",
    Isha: "العشاء",
    Maghrib: "المغرب",
    Sunrise: "الشروق",
  },
  en: {
    Asr: "Asr",
    Dhuhr: "Dhuhr",
    Fajr: "Fajr",
    Isha: "Isha",
    Maghrib: "Maghrib",
    Sunrise: "Sunrise",
  },
};

const formatClock = (time: string, locale: PageLocale) => {
  const [hour = "0", minute = "0"] = time.split(":");
  const date = new Date(Date.UTC(2026, 0, 1, Number(hour), Number(minute)));
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-AE" : "en-US", {
    hour: "numeric",
    hour12: true,
    minute: "2-digit",
    timeZone: "UTC",
  }).format(date);
};

const localizedPrayer = (prayer: PrayerTime, locale: PageLocale) => ({
  ...prayer,
  label: prayerName[locale][prayer.key],
  time: formatClock(prayer.time, locale),
});

export async function generatePrayerTimesMetadata(
  { params }: Props,
  locale: PageLocale = "en",
): Promise<Metadata> {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) return {};

  const isArabic = locale === "ar";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const title = isArabic
    ? `مواقيت الصلاة في ${cityName}`
    : `${city.name} Prayer Times`;
  const description = isArabic
    ? `مواقيت الصلاة اليومية والشهرية في ${cityName} مع الفجر والظهر والعصر والمغرب والعشاء.`
    : `Today and monthly prayer times for ${city.name}, including Fajr, Dhuhr, Asr, Maghrib, and Isha.`;

  return pageMetadata({
    title,
    description,
    path: `${isArabic ? "/ar" : "/en"}/city/${city.slug}/prayer-times`,
  });
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  return generatePrayerTimesMetadata(props);
}

export async function PrayerTimesPageContent({
  locale = "en",
  params,
}: Props & { locale?: PageLocale }) {
  const { city: citySlug } = await params;
  const city = await getCityBySlug(citySlug);
  if (!city) notFound();

  const isArabic = locale === "ar";
  const cityName =
    (typeof city.translations?.[locale]?.name === "string" &&
      city.translations[locale].name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const cityBasePath = isArabic ? `/ar/city/${city.slug}` : `/en/city/${city.slug}`;
  const copy = isArabic
    ? {
        badge: "مواقيت مباشرة",
        calendar: "تقويم الشهر",
        calculated: "طريقة الحساب",
        cityTime: "توقيت المدينة",
        intro:
          "مواقيت الصلاة اليومية والشهرية للمدينة، محسوبة مباشرة بحسب موقعها الجغرافي. يُفضّل دائمًا مراعاة إعلان المسجد المحلي عند اختلاف الدقائق.",
        next: "الصلاة القادمة",
        source: "مصدر البيانات",
        today: "مواقيت اليوم",
        title: `مواقيت الصلاة في ${cityName}`,
      }
    : {
        badge: "Live prayer times",
        calendar: "Monthly timetable",
        calculated: "Calculation method",
        cityTime: "City time",
        intro:
          "Daily and monthly prayer times calculated live for the city location. Local mosque announcements may vary by a few minutes.",
        next: "Next prayer",
        source: "Data source",
        today: "Today’s times",
        title: `${city.name} Prayer Times`,
      };

  const prayerTimes = await getPrayerTimesForCity(city);
  const nextPrayer = prayerTimes.nextPrayer
    ? localizedPrayer(prayerTimes.nextPrayer, locale)
    : undefined;
  const todayPrayers = prayerTimes.today.prayers.map((prayer) =>
    localizedPrayer(prayer, locale),
  );
  const cityTime = new Intl.DateTimeFormat(isArabic ? "ar-AE" : "en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: prayerTimes.timeZone,
  }).format(new Date());

  return (
    <PageShell
      breadcrumbs={[
        {
          label: isArabic ? "الرئيسية" : "Home",
          href: isArabic ? "/ar" : "/",
        },
        { label: cityName, href: cityBasePath },
        { label: copy.title },
      ]}
      locale={locale}
    >
      <JsonLd
        data={breadcrumbJsonLd(
          [
            { name: "Home", path: "/" },
            { name: cityName, path: cityBasePath },
            { name: copy.title, path: `${cityBasePath}/prayer-times` },
          ],
          locale,
        )}
      />
      <main dir={isArabic ? "rtl" : "ltr"}>
        <section className="bg-ink text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <Badge className="bg-irhal-lime text-ink" variant="secondary">
                <MoonStar aria-hidden="true" className="h-4 w-4" />
                {copy.badge}
              </Badge>
              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-white/76">
                {copy.intro}
              </p>
            </div>
            <Card className="border-white/10 bg-white text-ink">
              <CardContent className="p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-irhal-red">
                  {copy.next}
                </p>
                {nextPrayer ? (
                  <>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-black">
                          {nextPrayer.label}
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-ink/55">
                          {copy.cityTime}
                        </p>
                      </div>
                      <div className="rounded-full bg-irhal-lime px-4 py-3 text-2xl font-black text-ink">
                        {nextPrayer.time}
                      </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-ink/65">
                      {cityTime}
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-lg font-bold">
                    {isArabic ? "اكتملت صلوات اليوم" : "Today’s prayers are complete"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="border-b border-ink/10 bg-white">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 md:grid-cols-3">
            {[
              [copy.calculated, prayerTimes.methodName, Compass],
              [copy.source, prayerTimes.source, MapPin],
              [copy.cityTime, prayerTimes.timeZone, Clock3],
            ].map(([label, value, Icon]) => (
              <div
                className="flex items-center gap-3 rounded-lg border border-ink/10 bg-paper px-4 py-3"
                key={String(label)}
              >
                <Icon aria-hidden="true" className="h-5 w-5 text-coastal" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-ink/50">
                    {label as string}
                  </p>
                  <p className="text-sm font-bold text-ink">{value as string}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-paper py-12">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                  {copy.today}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
                  {prayerTimes.today.date.gregorian}
                </h2>
                <p className="mt-1 text-sm font-semibold text-ink/55">
                  {prayerTimes.today.date.hijri}
                </p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              {todayPrayers.map((prayer) => (
                <Card
                  className="border-ink/10 bg-white shadow-none"
                  key={prayer.key}
                >
                  <CardContent className="p-5">
                    <p className="text-sm font-bold text-ink/55">
                      {prayer.label}
                    </p>
                    <p className="mt-3 text-3xl font-black text-ink">
                      {prayer.time}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-ink/10 bg-white py-12">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-irhal-red">
                  {copy.calendar}
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
                  {prayerTimes.monthLabel}
                </h2>
              </div>
              <CalendarDays aria-hidden="true" className="h-8 w-8 text-coastal" />
            </div>
            <div className="mt-7 overflow-x-auto rounded-lg border border-ink/10">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-paper-deep text-xs font-black uppercase tracking-wide text-ink/60">
                  <tr>
                    <th className="border-b border-ink/10 px-4 py-3 text-start">
                      {isArabic ? "اليوم" : "Day"}
                    </th>
                    {todayPrayers.map((prayer) => (
                      <th
                        className="border-b border-ink/10 px-4 py-3 text-start"
                        key={prayer.key}
                      >
                        {prayer.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {prayerTimes.month.map((day) => (
                    <tr
                      className="odd:bg-white even:bg-paper/60"
                      key={day.date.isoDate}
                    >
                      <td className="border-b border-ink/5 px-4 py-3 font-bold text-ink">
                        {day.dayNumber}
                      </td>
                      {day.prayers.map((prayer) => (
                        <td
                          className="border-b border-ink/5 px-4 py-3 text-ink/70"
                          key={prayer.key}
                        >
                          {formatClock(prayer.time, locale)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default async function PrayerTimesPage(props: Props) {
  return <PrayerTimesPageContent {...props} />;
}
