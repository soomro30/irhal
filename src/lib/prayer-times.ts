import type { CityGuide } from "./city-data";

const ALADHAN_BASE_URL = "https://api.aladhan.com/v1";
const PRAYER_METHOD_BY_CITY: Record<string, number> = {
  karachi: 1,
};
const TIME_ZONE_BY_CITY: Record<string, string> = {
  karachi: "Asia/Karachi",
};

export type PrayerKey = "Fajr" | "Sunrise" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export type PrayerTime = {
  key: PrayerKey;
  label: string;
  time: string;
};

export type PrayerDay = {
  date: {
    gregorian: string;
    hijri: string;
    isoDate: string;
  };
  prayers: PrayerTime[];
};

export type MonthlyPrayerDay = PrayerDay & {
  dayNumber: string;
};

export type PrayerTimesPayload = {
  cityName: string;
  country: string;
  methodName: string;
  monthLabel: string;
  nextPrayer?: PrayerTime;
  source: string;
  timeZone: string;
  today: PrayerDay;
  updatedAt: string;
  month: MonthlyPrayerDay[];
};

type AladhanTimings = Record<string, string>;

type AladhanDay = {
  date: {
    gregorian: {
      date: string;
      day: string;
      month: { en: string; number: number };
      year: string;
    };
    hijri: {
      date: string;
      day: string;
      month: { ar: string; en: string; number: number };
      year: string;
    };
    readable: string;
  };
  meta: {
    method: { name: string };
    timezone: string;
  };
  timings: AladhanTimings;
};

type AladhanResponse<T> = {
  code: number;
  data: T;
  status: string;
};

const prayerKeys: PrayerKey[] = [
  "Fajr",
  "Sunrise",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

const prayerLabels: Record<PrayerKey, string> = {
  Asr: "Asr",
  Dhuhr: "Dhuhr",
  Fajr: "Fajr",
  Isha: "Isha",
  Maghrib: "Maghrib",
  Sunrise: "Sunrise",
};

const cleanTime = (value: string) => value.replace(/\s*\([^)]*\)\s*$/, "");

const cityDateParts = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((values, part) => {
      if (part.type !== "literal") values[part.type] = part.value;
      return values;
    }, {});

  return {
    date: `${parts.day}-${parts.month}-${parts.year}`,
    month: Number(parts.month),
    year: Number(parts.year),
  };
};

const cityNowMinutes = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((values, part) => {
      if (part.type !== "literal") values[part.type] = part.value;
      return values;
    }, {});

  return Number(parts.hour) * 60 + Number(parts.minute);
};

const timeToMinutes = (value: string) => {
  const [hour = "0", minute = "0"] = cleanTime(value).split(":");
  return Number(hour) * 60 + Number(minute);
};

const mapDay = (day: AladhanDay): PrayerDay => ({
  date: {
    gregorian: day.date.readable,
    hijri: `${day.date.hijri.day} ${day.date.hijri.month.en} ${day.date.hijri.year}`,
    isoDate: day.date.gregorian.date,
  },
  prayers: prayerKeys.map((key) => ({
    key,
    label: prayerLabels[key],
    time: cleanTime(day.timings[key] ?? ""),
  })),
});

const aladhanUrl = (
  endpoint: string,
  city: CityGuide,
  method: number,
) => {
  const url = new URL(`${ALADHAN_BASE_URL}/${endpoint}`);
  url.searchParams.set("latitude", String(city.latitude));
  url.searchParams.set("longitude", String(city.longitude));
  url.searchParams.set("method", String(method));
  url.searchParams.set("school", "1");
  return url;
};

const fetchAladhan = async <T>(url: URL): Promise<T> => {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 6 },
  });

  if (!response.ok) {
    throw new Error(`Prayer times request failed: ${response.status}`);
  }

  const payload = (await response.json()) as AladhanResponse<T>;
  if (payload.code !== 200 || payload.status !== "OK") {
    throw new Error("Prayer times provider returned an invalid response");
  }
  return payload.data;
};

export const getPrayerTimesForCity = async (
  city: CityGuide,
): Promise<PrayerTimesPayload> => {
  const method = PRAYER_METHOD_BY_CITY[city.slug] ?? 3;
  const timeZone = TIME_ZONE_BY_CITY[city.slug] ?? "UTC";
  const { date, month, year } = cityDateParts(timeZone);
  const todayUrl = aladhanUrl(`timings/${date}`, city, method);
  const monthUrl = aladhanUrl(`calendar/${year}/${month}`, city, method);

  const [todayData, monthData] = await Promise.all([
    fetchAladhan<AladhanDay>(todayUrl),
    fetchAladhan<AladhanDay[]>(monthUrl),
  ]);
  const today = mapDay(todayData);
  const nowMinutes = cityNowMinutes(timeZone);
  const nextPrayer = today.prayers
    .filter((prayer) => prayer.key !== "Sunrise")
    .find((prayer) => timeToMinutes(prayer.time) >= nowMinutes);

  return {
    cityName: city.name,
    country: city.country,
    methodName: todayData.meta.method.name,
    month: monthData.map((day) => ({
      ...mapDay(day),
      dayNumber: day.date.gregorian.day,
    })),
    monthLabel: `${todayData.date.gregorian.month.en} ${todayData.date.gregorian.year}`,
    nextPrayer,
    source: "AlAdhan Prayer Times API",
    timeZone: todayData.meta.timezone || timeZone,
    today,
    updatedAt: new Date().toISOString(),
  };
};
