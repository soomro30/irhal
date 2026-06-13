import {
  PracticalCityInfoCarousel,
  type PracticalInfoCard,
} from "@/components/practical-city-info-carousel";
import type {
  CityGuide,
  GuideParagraphBlock,
  GuideTableBlock,
} from "@/lib/city-data";

const tableByPurpose = (city: CityGuide, purpose: string) =>
  city.fullGuide.tables.find((table) => table.purpose === purpose);

const fastFact = (table: GuideTableBlock | undefined, label: string) =>
  table?.rows.find(
    (row) => row.values.fact?.toLowerCase() === label.toLowerCase(),
  )?.values.current_guide_value;

const paragraphAfterHeading = (
  city: CityGuide,
  sectionSlug: string,
  heading: string,
) => {
  const section = city.fullGuide.sections.find(
    (item) => item.slug === sectionSlug,
  );
  const blocks = section?.blocks ?? [];
  const headingIndex = blocks.findIndex(
    (block) =>
      block.type === "paragraph" &&
      block.text.toLowerCase() === heading.toLowerCase(),
  );

  if (headingIndex === -1) return undefined;

  return blocks.slice(headingIndex + 1).find(
    (block): block is GuideParagraphBlock => block.type === "paragraph",
  )?.text;
};

const climateSummary = (table: GuideTableBlock | undefined) => {
  const rowFor = (month: string) =>
    table?.rows.find((row) => row.values.month === month)?.values;
  const january = rowFor("January");
  const july = rowFor("July");
  const december = rowFor("December");

  return {
    primary:
      december?.tour_guide_advice ??
      january?.tour_guide_advice ??
      "Use the month-by-month climate table before planning outdoor days.",
    secondary: july
      ? `${july.month}: ${july.typical_feel}; ${july.tour_guide_advice}`
      : "Monsoon and heat periods need extra planning.",
  };
};

const emergencySummary = (table: GuideTableBlock | undefined) =>
  (table?.rows ?? []).slice(0, 4).map((row) => ({
    label: row.values.service,
    value: row.values.number_contact,
  }));

const holidaySummary = (table: GuideTableBlock | undefined) =>
  (table?.rows ?? []).slice(0, 3).map((row) => ({
    label: row.values.holiday,
    value: row.values.date_basis,
  }));

const arabicEmergencyLabel: Record<string, string> = {
  "Edhi ambulance": "إسعاف إيدهي",
  "Fire brigade": "الدفاع المدني",
  "Police emergency": "شرطة الطوارئ",
  "Sindh Rescue / ambulance": "إنقاذ السند / الإسعاف",
};

const arabicHolidayLabel: Record<string, string> = {
  "Kashmir Day": "يوم كشمير",
  "Labour Day": "يوم العمال",
  "Pakistan Day": "يوم باكستان",
};

const formatInfoItems = (
  items: { label: string; value: string }[],
  locale: "en" | "ar",
  translations: Record<string, string>,
) =>
  items
    .slice(0, 2)
    .map((item) => {
      const label = locale === "ar" ? translations[item.label] ?? item.label : item.label;
      return `${label}: ${item.value}`;
    })
    .join(" • ");

export function PracticalCityInfo({
  city,
  locale = "en",
}: {
  city: CityGuide;
  locale?: "en" | "ar";
}) {
  const isArabic = locale === "ar";
  const localePrefix = isArabic ? "/ar" : "/en";
  const cityBasePath = `${localePrefix}/city/${city.slug}`;
  const cityTranslation = city.translations?.[locale] ?? {};
  const cityName =
    (typeof cityTranslation.name === "string" && cityTranslation.name) ||
    (isArabic && city.slug === "karachi" ? "كراتشي" : city.name);
  const fastFacts = tableByPurpose(city, "fast_facts");
  const climate = tableByPurpose(city, "climate");
  const emergency = tableByPurpose(city, "emergency_numbers");
  const holidays = tableByPurpose(city, "public_holidays");
  const exchangeText =
    paragraphAfterHeading(city, "visitor-information", "Exchange rates") ??
    "Check an authorised exchange source before budgeting your trip.";
  const climateInfo = climateSummary(climate);
  const emergencyItems = emergencySummary(emergency);
  const holidayItems = holidaySummary(holidays);
  const languageValue = fastFact(fastFacts, "Languages");
  const translatedCurrency =
    typeof cityTranslation.currency === "string"
      ? cityTranslation.currency
      : city.currency === "GBP"
        ? "الجنيه الإسترليني"
        : city.currency === "PKR"
          ? "روبية باكستانية"
          : city.currency;
  const translatedLanguages =
    typeof cityTranslation.languages === "string"
      ? cityTranslation.languages
      : city.slug === "karachi"
        ? "الأردية والإنجليزية"
        : city.languages
            .map((language) =>
              language === "English"
                ? "الإنجليزية"
                : language === "Arabic"
                  ? "العربية"
                  : language,
            )
            .join("، ");
  const translatedTimezone =
    city.timezone === "Europe/London"
      ? "توقيت لندن"
      : city.timezone === "Asia/Karachi"
        ? "توقيت كراتشي"
        : city.timezone;
  const currencyValue = isArabic
    ? translatedCurrency
    : fastFact(fastFacts, "Currency") ?? city.currency;
  const arabicClimatePrimary =
    "تعد الأشهر من نوفمبر إلى فبراير الأنسب للزيارة، خصوصًا للأنشطة الخارجية والمطاعم والمشي على الواجهة البحرية.";
  const arabicClimateSecondary =
    "يوليو: حرارة ورطوبة مرتفعة؛ قد تؤثر أمطار الموسم على الحركة داخل المدينة.";
  const arabicExchangeText =
    "استخدم مصدر صرف معتمد قبل إعداد الميزانية أو نشر الأسعار، فأسعار الصرف قابلة للتغير.";
  const cards: PracticalInfoCard[] = [
    {
      title: isArabic ? "الطقس وأفضل وقت للزيارة" : "Weather and When To Go",
      icon: "climate",
      badge: isArabic
        ? `${climate?.rows.length ?? 0} شهر`
        : `${climate?.rows.length ?? 0} months`,
      body: isArabic ? arabicClimatePrimary : climateInfo.primary,
      detail: isArabic ? arabicClimateSecondary : climateInfo.secondary,
      href: `${cityBasePath}/section/visitor-information/when-to-go`,
    },
    {
      title: isArabic ? "أسعار الصرف" : "Exchange Rates",
      icon: "exchange",
      badge: isArabic ? "تحقق فوري" : "Verify live",
      body: isArabic ? arabicExchangeText : exchangeText,
      detail: isArabic ? `العملة: ${currencyValue}` : `Currency: ${currencyValue}`,
      href: `${cityBasePath}/section/visitor-information/exchange-rates`,
    },
    {
      title: isArabic ? "الصحة والسلامة" : "Health and Safety",
      icon: "health",
      badge: isArabic ? "إرشادات" : "Safety",
      body: isArabic
        ? "إرشادات عملية حول جرائم الشارع، التنقل، مياه الشرب، الحرارة، والأمطار الموسمية."
        : "Practical guidance on street crime, transport, drinking water, heat, and monsoon risks.",
      detail: isArabic
        ? "احفظ أرقام الطوارئ وتحقق من إرشادات السفر قبل التنقل."
        : "Keep emergency contacts saved and check travel advice before moving around.",
      href: `${cityBasePath}/section/health-and-safety/health-and-safety`,
    },
    {
      title: isArabic ? "أرقام الطوارئ" : "Emergency Numbers",
      icon: "emergency",
      badge: isArabic
        ? `${emergency?.rows.length ?? 0} جهات`
        : `${emergency?.rows.length ?? 0} contacts`,
      body: isArabic
        ? "مراجع الطوارئ الأساسية المستوردة من دليل كراتشي."
        : "Keep these emergency references handy while moving around Karachi.",
      detail: formatInfoItems(emergencyItems, locale, arabicEmergencyLabel),
      href: `${cityBasePath}/section/health-and-safety`,
    },
    {
      title: isArabic ? "العطلات الرسمية" : "Public Holidays",
      icon: "calendar",
      badge: isArabic
        ? `${holidays?.rows.length ?? 0} مواعيد`
        : `${holidays?.rows.length ?? 0} dates`,
      body: isArabic
        ? "قد تؤثر العطلات على الحركة، البنوك، المتاحف، وساعات التسوق."
        : "Holiday timing can change city traffic, banks, museums, and shopping hours.",
      detail: formatInfoItems(holidayItems, locale, arabicHolidayLabel),
      href: `${cityBasePath}/section/visitor-information/public-holidays`,
    },
    {
      title: isArabic ? "اللغة والعملة" : "Language and Currency",
      icon: "language",
      badge: isArabic ? translatedCurrency : city.currency,
      body:
        isArabic ? translatedLanguages : languageValue ??
        `${city.languages.join(", ")} are represented in this guide.`,
      detail: isArabic ? `المنطقة الزمنية: ${translatedTimezone}` : `Time zone: ${city.timezone}`,
      href: `${cityBasePath}/section/visitor-information`,
    },
  ];

  return (
    <PracticalCityInfoCarousel
      cards={cards}
      cityName={cityName}
      citySlug={city.slug}
      dir={isArabic ? "rtl" : "ltr"}
      labels={{
        action: isArabic ? "عرض معلومات الزائر" : "View visitor info",
        details: isArabic ? "اكتشف" : "Discover",
        eyebrow: isArabic ? "معلومات أساسية" : "Practical city info",
        next: isArabic ? "عرض المعلومات التالية" : "Next practical info",
        previous: isArabic ? "عرض المعلومات السابقة" : "Previous practical info",
        title: isArabic
          ? "الطقس، العملة، السلامة والأساسيات"
          : "Weather, Money, Safety and Basics",
      }}
      pathPrefix={localePrefix}
    />
  );
}
