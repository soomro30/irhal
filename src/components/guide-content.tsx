import type { GuideBlock, GuideTableBlock } from "@/lib/city-data";

type Locale = "en" | "ar";

const keyForHeader = (header: string) =>
  header
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const headerValueKeys: Record<string, string> = {
  "Average high": "average_high",
  "Average low": "average_low",
  "Average rainfall": "average_rainfall",
  Borough: "borough",
  Date: "date",
  Detail: "detail",
  "Halal restaurants live map": "halal_restaurants_live_map",
  Holiday: "holiday",
  Item: "item",
  "Masjids and prayer rooms live map": "masjids_and_prayer_rooms_live_map",
  Month: "month",
  "المطاعم الحلال - خريطة حيّة": "halal_restaurants_live_map",
  "المساجد ومرافق الصلاة - خريطة حيّة": "masjids_and_prayer_rooms_live_map",
  "متوسط الأمطار": "average_rainfall",
  "متوسط الحرارة الصغرى": "average_low",
  "متوسط الحرارة العظمى": "average_high",
  "البلدية / الحي": "borough",
  "التاريخ": "date",
  "التفصيل": "detail",
  "الشهر": "month",
  "العطلة": "holiday",
  "المعلومة": "item",
};

const valueKeyForHeader = (header: string) =>
  headerValueKeys[header] ?? keyForHeader(header);

const arabicHeaders: Record<string, string> = {
  "Current guide value": "القيمة الحالية في الدليل",
  "Date / basis": "التاريخ / الأساس",
  "Editorial note": "ملاحظة تحريرية",
  Fact: "المعلومة",
  Borough: "البلدية / الحي",
  "Halal restaurants live map": "المطاعم الحلال - خريطة حيّة",
  Holiday: "العطلة",
  Month: "الشهر",
  "Masjids and prayer rooms live map": "المساجد ومرافق الصلاة - خريطة حيّة",
  Note: "ملاحظة",
  "Number / contact": "الرقم / جهة الاتصال",
  Service: "الخدمة",
  "Tour guide advice": "نصيحة الدليل",
  "Typical feel": "الإحساس المعتاد بالطقس",
};

const arabicBlockText: Record<string, string> = {
  "Annual temperature and climate guide": "دليل درجات الحرارة والمناخ السنوي",
  "Emergency numbers": "أرقام الطوارئ",
  "Fast facts": "حقائق سريعة",
  "Public holidays": "العطل الرسمية",
};

const arabicValueByPurpose: Record<string, Record<string, string>> = {
  climate: {
    April: "أبريل",
    August: "أغسطس",
    "Comfortable, good for heritage walks and festivals":
      "أجواء مريحة ومناسبة لجولات التراث والمهرجانات",
    "Coolest month; pleasant days and breezy evenings; best walking weather":
      "أبرد أشهر السنة؛ أيام لطيفة وأمسيات منعشة، وهو أفضل طقس للمشي",
    December: "ديسمبر",
    "Excellent month for outdoor dining, beaches and walking":
      "شهر ممتاز لتناول الطعام في الهواء الطلق وزيارة الشواطئ والمشي",
    February: "فبراير",
    "Good travel weather returns": "عودة الطقس المناسب للسفر",
    "Hot, humid, sea breeze helps only in evening":
      "حار ورطب؛ لا تساعد نسمة البحر إلا في المساء غالبًا",
    "Hotter afternoons; plan indoor museums and malls mid-day":
      "فترات الظهيرة أكثر حرارة؛ خطط للمتاحف والمراكز التجارية في منتصف النهار",
    January: "يناير",
    July: "يوليو",
    June: "يونيو",
    March: "مارس",
    May: "مايو",
    "Monsoon and humid; beach plans depend on weather":
      "موسمي ورطب؛ تعتمد خطط الشاطئ على حالة الطقس",
    "Monsoon risk; drainage/traffic delays during heavy rain":
      "مخاطر أمطار موسمية؛ قد تتأثر الحركة وتصريف المياه أثناء الأمطار الغزيرة",
    November: "نوفمبر",
    October: "أكتوبر",
    September: "سبتمبر",
    "Still humid; late monsoon/heat pockets":
      "رطوبة مستمرة؛ وقد تظهر موجات حر أو بقايا أمطار موسمية متأخرة",
    "Very hot; heatwaves can push above 40 C":
      "حار جدًا؛ قد تدفع موجات الحر درجات الحرارة إلى أكثر من 40 درجة مئوية",
    "Warm but improving; evenings become easier":
      "دافئ مع تحسن تدريجي؛ تصبح الأمسيات أسهل للتنقل",
    "Warmer, still workable if mornings/evenings are used":
      "أكثر دفئًا، لكنه مناسب إذا استُخدمت الصباحات والأمسيات",
  },
  emergency_numbers: {
    "Ambulance/welfare service; verify local availability":
      "خدمة إسعاف ورعاية؛ تحقّق من التوفر المحلي",
    CPLC: "لجنة اتصال المواطنين والشرطة",
    "Chhipa ambulance": "إسعاف شيبا",
    "Citizen-police liaison and crime reporting support":
      "دعم للتواصل بين المواطنين والشرطة والإبلاغ عن الجرائم",
    "Edhi ambulance": "إسعاف إيدهي",
    "Emergency rescue/medical response": "استجابة إنقاذ وطوارئ طبية",
    "Fire brigade": "الدفاع المدني / الإطفاء",
    "Karachi fire emergency reference": "مرجع طوارئ الإطفاء في كراتشي",
    "Major welfare ambulance service": "خدمة إسعاف خيرية رئيسية",
    "Police emergency": "شرطة الطوارئ",
    "Sindh Rescue / ambulance": "إنقاذ السند / الإسعاف",
    "Use for immediate police response": "يُستخدم للاستجابة الشرطية العاجلة",
  },
  fast_facts: {
    "About 19 C average; mild winter":
      "نحو 19 درجة مئوية في المتوسط؛ شتاء معتدل",
    "About 20.3 million in the 2023 census for Karachi division; metropolitan reality is larger in daily movement":
      "نحو 20.3 مليون نسمة في تعداد 2023 لقسم كراتشي؛ والواقع الحضري اليومي أوسع من ذلك",
    "About 30 C average; humid monsoon period":
      "نحو 30 درجة مئوية في المتوسط؛ فترة موسمية رطبة",
    "Annual rainfall": "معدل الأمطار السنوي",
    "Arabian Sea coast, Sindh province, southern Pakistan":
      "ساحل بحر العرب، إقليم السند، جنوب باكستان",
    "Average January temperature": "متوسط درجة الحرارة في يناير",
    "Average July temperature": "متوسط درجة الحرارة في يوليو",
    Currency: "العملة",
    "Dialing code": "رمز الاتصال",
    "Emergency numbers": "أرقام الطوارئ",
    Languages: "اللغات",
    Location: "الموقع",
    "Pakistan Standard Time, UTC+05:00":
      "توقيت باكستان الرسمي، UTC+05:00",
    "Pakistani Rupee (PKR)": "الروبية الباكستانية (PKR)",
    "Police 15; Rescue 1122; Fire 16; Edhi 115; Chhipa 1020; CPLC 1102 / +92-21-35662222":
      "الشرطة 15؛ الإنقاذ 1122؛ الإطفاء 16؛ إيدهي 115؛ شيبا 1020؛ لجنة اتصال المواطنين والشرطة 1102 / ‎+92-21-35662222",
    Population: "عدد السكان",
    "Time zone": "المنطقة الزمنية",
    "Urdu widely spoken; Sindhi, English, Punjabi, Pashto, Balochi, Gujarati, Memoni and other languages are common":
      "الأردية واسعة الانتشار؛ كما تُستخدم السندية والإنجليزية والبنجابية والبشتوية والبلوشية والغوجاراتية والميمونية ولغات أخرى",
    "Variable and monsoon-driven; the wettest period is typically July-August":
      "متغير ومرتبط بالأمطار الموسمية؛ وعادة ما تكون أكثر الفترات رطوبة بين يوليو وأغسطس",
    "+92 country code; Karachi fixed-line area code 21":
      "رمز الدولة ‎+92؛ ورمز الخطوط الثابتة في كراتشي 21",
  },
  public_holidays: {
    "1 May": "1 مايو",
    "14 August": "14 أغسطس",
    "23 March": "23 مارس",
    "25 December": "25 ديسمبر",
    "5 February": "5 فبراير",
    "9 November": "9 نوفمبر",
    "Eid-ul-Fitr, Eid-ul-Azha, Ashura, Eid Milad-un-Nabi":
      "عيد الفطر، عيد الأضحى، عاشوراء، المولد النبوي",
    "Independence Day": "يوم الاستقلال",
    "Iqbal Day": "يوم إقبال",
    "Islamic calendar dates": "تواريخ التقويم الهجري",
    "Kashmir Day": "يوم كشمير",
    "Labour Day": "يوم العمال",
    "Moon-sighting based; verify official Pakistan/Sindh notifications each year":
      "يعتمد على رؤية الهلال؛ تحقّق من الإعلانات الرسمية في باكستان والسند كل عام",
    "National public holiday": "عطلة رسمية وطنية",
    "Pakistan Day": "يوم باكستان",
    "Quaid-e-Azam Day / Christmas": "يوم قائد أعظم / عيد الميلاد",
  },
};

const translateTableValue = (
  table: GuideTableBlock,
  value: string,
  locale: Locale,
) => {
  if (locale !== "ar") return value;
  if (/^\d+[-–]\d+\+?\s*C$/.test(value)) {
    return value.replace(/\s*C$/, " درجة مئوية");
  }
  return arabicValueByPurpose[table.purpose]?.[value] ?? value;
};

const translateBlockText = (text: string, locale: Locale) =>
  locale === "ar" ? arabicBlockText[text] ?? text : text;

const renderInlineText = (text: string, locale: Locale) =>
  translateBlockText(text, locale)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong className="font-black text-ink" key={`${part}-${index}`}>
          {part.slice(2, -2)}
        </strong>
      ) : (
        part
      ),
    );

function renderLinkedValue(
  table: GuideTableBlock,
  rowIndex: number,
  header: string,
  locale: Locale,
) {
  const key = valueKeyForHeader(header);
  const row = table.rows[rowIndex];
  const value = row.values[key] || "";
  const links = row.links[key];

  if (links?.[0]?.url) {
    return (
      <a className="font-semibold text-ink underline" href={links[0].url}>
        {translateTableValue(table, value || links[0].text, locale)}
      </a>
    );
  }

  return translateTableValue(table, value, locale);
}

function GuideTable({
  locale,
  table,
}: {
  locale: Locale;
  table: GuideTableBlock;
}) {
  const isArabic = locale === "ar";

  return (
    <div
      className="my-6 overflow-x-auto rounded-lg border border-ink/10 bg-white shadow-sm"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <table
        className={`min-w-full border-collapse text-sm ${
          isArabic ? "text-right" : "text-left"
        }`}
      >
        <thead className="bg-paper-deep text-xs font-bold uppercase tracking-wide text-ink/65">
          <tr>
            {table.headers.map((header) => (
              <th
                className="border-b border-ink/10 px-4 py-3 font-bold"
                key={header}
              >
                {isArabic ? arabicHeaders[header] ?? header : header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((_, rowIndex) => (
            <tr
              className="align-top odd:bg-white even:bg-paper/70"
              key={`${table.purpose}-${rowIndex}`}
            >
              {table.headers.map((header) => (
                <td
                  className="max-w-[360px] border-b border-ink/5 px-4 py-3 leading-6 text-ink/75"
                  key={header}
                >
                  {renderLinkedValue(table, rowIndex, header, locale)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GuideContent({
  blocks,
  locale = "en",
}: {
  blocks: GuideBlock[];
  locale?: Locale;
}) {
  return (
    <div className="guide-content">
      {blocks.map((block, index) => {
        if (block.type === "table") {
          return (
            <GuideTable
              key={`${block.purpose}-${index}`}
              locale={locale}
              table={block}
            />
          );
        }

        if (block.style === "Heading 2") {
          return (
            <h2
              className="mt-8 max-w-4xl text-2xl font-black text-ink"
              key={`${block.text}-${index}`}
            >
              {renderInlineText(block.text, locale)}
            </h2>
          );
        }

        if (block.style === "Heading 3") {
          return (
            <h3
              className="mt-6 max-w-4xl text-xl font-semibold text-ink"
              key={`${block.text}-${index}`}
            >
              {renderInlineText(block.text, locale)}
            </h3>
          );
        }

        if (block.style === "List Bullet" || block.style === "List Number") {
          return (
            <p
              className="mt-3 flex max-w-4xl gap-3 text-base leading-7 text-ink/75"
              key={`${block.text}-${index}`}
            >
              <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-coastal" />
              <span>{renderInlineText(block.text, locale)}</span>
            </p>
          );
        }

        return (
          <p
            className="mt-4 max-w-4xl text-base leading-8 text-ink/75"
            key={`${block.text}-${index}`}
          >
            {renderInlineText(block.text, locale)}
          </p>
        );
      })}
    </div>
  );
}
