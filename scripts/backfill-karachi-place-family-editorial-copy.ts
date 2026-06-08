import nextEnv from "@next/env";
import { Client } from "pg";
import { z } from "zod";

type GuideItemRow = {
  _status: string | null;
  arabic_area: string | null;
  arabic_category: string | null;
  arabic_overview: string | null;
  arabic_summary: string | null;
  arabic_title: string | null;
  area: string | null;
  body: unknown;
  category: string | null;
  id: number;
  imported_details: Record<string, unknown> | null;
  kind: "family" | "place";
  map_url: string | null;
  slug: string;
  summary: string | null;
  title: string;
  workflow_status: string | null;
};

const dryRun = process.argv.includes("--dry-run");
const refreshReview = process.argv.includes("--refresh-review");
const verifiedAt = "2026-06-08";

nextEnv.loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required.");
}

const copySchema = z.object({
  arabicOverview: z.array(z.string().min(80)).min(2),
  arabicSummary: z.string().min(90),
  overview: z.array(z.string().min(80)).min(2),
  summary: z.string().min(100),
});

const hasArabic = (value?: string | null) =>
  Boolean(value && /[\u0600-\u06ff]/.test(value));

const hasLexicalBody = (value: unknown) => {
  if (!value || typeof value !== "object") return false;
  const root = (value as { root?: { children?: unknown[] } }).root;
  return Array.isArray(root?.children) && root.children.length > 0;
};

const lexicalText = (value: unknown) => {
  if (!value || typeof value !== "object") return "";
  const root = (value as { root?: { children?: unknown[] } }).root;
  if (!Array.isArray(root?.children)) return "";
  return root.children
    .map((paragraph) => {
      if (!paragraph || typeof paragraph !== "object") return "";
      const children = (paragraph as { children?: unknown[] }).children;
      if (!Array.isArray(children)) return "";
      return children
        .map((child) =>
          child && typeof child === "object"
            ? ((child as { text?: string }).text ?? "")
            : "",
        )
        .join("");
    })
    .join("\n\n");
};

const hasGeneratedEnglishBody = (value: unknown) =>
  lexicalText(value).includes("Editorial note:");

const hasGeneratedArabicOverview = (value?: string | null) =>
  [
    "قبل الزيارة، ينبغي مراجعة رابط الخريطة",
    "للعائلات، تكمن الوصفة الناجحة في البساطة",
    "ينتمي",
    "يمنح",
  ].some((snippet) => clean(value).includes(snippet));

const wordCount = (value?: string | null) =>
  (value ?? "").trim().split(/\s+/).filter(Boolean).length;

const clean = (value?: string | null) => value?.trim() || "";

const bodyToLexical = (paragraphs: string[], direction: "ltr" | "rtl") => ({
  root: {
    type: "root" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    direction,
    children: paragraphs.map((paragraph) => ({
      type: "paragraph" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction,
      children: [
        {
          type: "text" as const,
          text: paragraph,
          format: 0,
          style: "",
          mode: "normal" as const,
          detail: 0,
          version: 1,
        },
      ],
    })),
  },
});

const lower = (value: string) => value.toLowerCase();

const classify = (row: GuideItemRow) => {
  if (row.kind === "family") return "family";

  const haystack = lower(
    `${row.title} ${row.slug} ${row.category ?? ""} ${row.summary ?? ""}`,
  );

  if (/beach|coast|island|harbour|harbor|jetty|lighthouse|rocks|lake/.test(haystack)) {
    return "coast";
  }
  if (/shrine|mosque|masjid|darul|jamia/.test(haystack)) {
    return "sacred";
  }
  if (/museum|science|planetarium|exhibition|maritime|state bank/.test(haystack)) {
    return "museum";
  }
  if (/market|bazaar|mall|shopping|retail|commercial|road|food street|food area/.test(haystack)) {
    if (/food|restaurant|tea|bbq/.test(haystack)) return "food";
    if (/mall/.test(haystack)) return "mall";
    return "market";
  }
  if (/park|garden|forest|hill|zoo|safari|adventure|resort/.test(haystack)) {
    return "park";
  }
  if (/gallery|arts|council|alliance|british council|culture|auditorium/.test(haystack)) {
    return "culture";
  }
  if (/campus|university|college|school|ned/.test(haystack)) {
    return "campus";
  }
  if (/thatta|makli|keenjhar|chaukhandi|day trip|bahria town/.test(haystack)) {
    return "dayTrip";
  }
  if (/building|hall|custom|clock|chowk|heritage|cemetery|chundrigar|mansion/.test(haystack)) {
    return "heritage";
  }

  return "general";
};

const subject = (row: GuideItemRow) => {
  const type = clean(row.category) || (row.kind === "family" ? "family stop" : "visitor stop");
  const area = clean(row.area) || "Karachi";
  return { area, note: clean(row.summary), title: row.title, type };
};

const usefulType = (row: GuideItemRow, fallback: string) => {
  const type = clean(row.category);
  if (!type || lower(type) === lower(row.title)) return fallback;
  return type.toLowerCase();
};

const familyPurpose = (row: GuideItemRow) => {
  const haystack = lower(`${row.title} ${row.slug} ${row.summary ?? ""}`);

  if (/science|magnifi/.test(haystack)) return "hands-on learning and indoor discovery";
  if (/paf|maritime|museum/.test(haystack)) return "open displays, collections, and easy educational pacing";
  if (/mall|dolmen|luckyone/.test(haystack)) return "air-conditioned meals, facilities, and a low-effort reset";
  if (/park|bagh|jahangir/.test(haystack)) return "open space and a softer pause between busier city stops";
  if (/zoo|safari/.test(haystack)) return "an animal-themed outing, current conditions permitting";
  if (/beach|camel|horse/.test(haystack)) return "a classic beach moment under close adult supervision";
  if (/resort|adventure|bahria/.test(haystack)) return "a longer leisure day outside the dense city core";

  return "a flexible child-friendly pause in a demanding city itinerary";
};

const arabicFamilyPurpose = (row: GuideItemRow) => {
  const haystack = lower(`${row.title} ${row.slug} ${row.summary ?? ""}`);

  if (/science|magnifi/.test(haystack)) return "التعلم التفاعلي والاكتشاف الداخلي";
  if (/paf|maritime|museum/.test(haystack)) return "العروض المفتوحة والمقتنيات والإيقاع التعليمي السهل";
  if (/mall|dolmen|luckyone/.test(haystack)) return "الوجبات والمرافق المكيّفة واستراحة قليلة الجهد";
  if (/park|bagh|jahangir/.test(haystack)) return "المساحة المفتوحة واستراحة ألطف بين محطات المدينة المزدحمة";
  if (/zoo|safari/.test(haystack)) return "نزهة مرتبطة بالحيوانات، متى كانت الظروف الحالية مناسبة";
  if (/beach|camel|horse/.test(haystack)) return "لحظة شاطئية تقليدية تحت إشراف بالغين عن قرب";
  if (/resort|adventure|bahria/.test(haystack)) return "يوم ترفيهي أطول خارج القلب الحضري الكثيف";

  return "استراحة مرنة وملائمة للأطفال داخل برنامج مدينة مرهق";
};

const englishSummary = (row: GuideItemRow, group: string) => {
  const { area, title } = subject(row);
  const typeLabel = usefulType(row, group === "museum" ? "museum" : "visitor stop");
  const purpose = familyPurpose(row);

  const summaries: Record<string, string> = {
    campus: `${title} is a Karachi education landmark in ${area}, best treated as contextual city heritage rather than a casual walk-in attraction; confirm permissions before planning a visit.`,
    coast: `${title} is a coastal Karachi outing for sea air, sunset, and slower family pacing, with weather, tides, transport, and access best checked before committing the day.`,
    culture: `${title} is a cultural stop in ${area} for exhibitions, events, creative programming, and Karachi's arts community; check the current calendar before building a route around it.`,
    dayTrip: `${title} works as a day-trip extension from Karachi, adding heritage, coast, or landscape beyond the city core; plan transport, daylight, permissions, and food stops carefully.`,
    family: `${title} is a practical Karachi family stop for ${purpose}, best used with verified hours, shaded breaks, snacks, and a route that avoids cross-city fatigue.`,
    food: `${title} is a Karachi food cluster in ${area}, best for casual evening grazing, tea, snacks, and family-style restaurants; go with current recommendations and a flexible appetite.`,
    general: `${title} is a useful Karachi guide stop in ${area}, giving visitors a focused way to understand the city's neighbourhood rhythm, local movement, and everyday travel texture.`,
    heritage: `${title} anchors Karachi's ${area} heritage map, giving visitors a street-level view of the city's civic, colonial, mercantile, and port-era architecture.`,
    mall: `${title} is an air-conditioned retail and dining stop in ${area}, useful for families, heat breaks, reliable facilities, and easy meals between Karachi sightseeing clusters.`,
    market: `${title} is a working ${area} market for local shopping, street-level Karachi commerce, and neighbourhood texture; visit with a clear plan and patience for crowded lanes.`,
    museum: `${title} gives Karachi visitors a focused ${typeLabel} stop in ${area}, useful for indoor pacing, collections, interpretation, or hands-on learning without losing a full day to transit.`,
    park: `${title} gives Karachi visitors a green pause in ${area}, best for early walks, family breathing space, and resetting between busier market, museum, or seafront stops.`,
    sacred: `${title} is a spiritually important ${typeLabel} in ${area}, best approached respectfully with modest dress, prayer-time awareness, and a plan for nearby traffic and crowds.`,
  };

  return summaries[group] ?? summaries.general;
};

const englishOverview = (row: GuideItemRow, group: string) => {
  const { area, title } = subject(row);
  const purpose = familyPurpose(row);
  const practicalBase =
    "Before visiting, check the map link, current opening pattern, transport route, and recent local context. Karachi rewards cluster-based planning: pair this stop with nearby food, shopping, museum, beach, or heritage routes instead of crossing the city for a single item.";

  const firstParagraphs: Record<string, string> = {
    campus: `${title} sits in ${area} as part of Karachi's education story. It is not primarily a tourist attraction, but it helps explain the city's academic, professional, and civic landscape, especially for visitors tracing institutions rather than only monuments.`,
    coast: `${title} brings the Arabian Sea into the Karachi itinerary. Its value is less about a polished resort experience and more about open horizon, local families, changing light, and the city's habit of moving toward the water when the day softens.`,
    culture: `${title} belongs to Karachi's cultural layer: galleries, libraries, performance spaces, talks, and civic arts programming that reveal the city beyond beaches and markets. It is strongest when there is an exhibition, reading, workshop, or public event underway.`,
    dayTrip: `${title} expands the Karachi guide beyond the dense urban core. It suits travellers who have already seen the main city clusters and want a longer day built around heritage, landscape, coastal air, or a quieter change of pace.`,
    family: `${title} works best as a paced family stop rather than an over-planned attraction. Its value is ${purpose}, while adults keep the day manageable in Karachi's heat, traffic, and long transfer times.`,
    food: `${title} is part of Karachi's street-level food culture, where the city is often easier to understand through grills, snacks, tea, family tables, and late-evening movement than through monuments alone.`,
    general: `${title} is worth keeping in the Karachi guide because it shows a specific slice of the city rather than a generic attraction. The listing is most useful when treated as part of the surrounding ${area} route.`,
    heritage: `${title} helps define the architectural memory of ${area}. Karachi's old civic, port, banking, and market districts still carry layers of colonial, mercantile, and post-independence history, even when the streets around them feel busy and improvised.`,
    mall: `${title} is a practical Karachi stop as much as a shopping destination. In a hot, crowded city, air-conditioning, food courts, restrooms, predictable security, and family facilities can make a route feel dramatically easier.`,
    market: `${title} is not a curated boutique experience; it is working Karachi. Expect dense lanes, bargaining energy, deliveries, small shops, and a stronger sense of local commerce than a conventional sightseeing stop can provide.`,
    museum: `${title} gives structure to a Karachi sightseeing day by adding collections, interpretation, and indoor pacing. It is a good counterweight to the city's beaches, bazaars, and long outdoor transfers.`,
    park: `${title} offers the kind of breathing space Karachi itineraries often need. Use it for early walking, a family pause, a softer transition between neighbourhoods, or a short reset before returning to busier city streets.`,
    sacred: `${title} is part of Karachi's living religious landscape, so the visit should feel observational and respectful rather than purely touristic. Dress modestly, move quietly, and be mindful of prayer times, shrine etiquette, and family crowds.`,
  };

  const secondParagraphs: Record<string, string> = {
    campus: `Access can be restricted or permission-based, so treat ${title} as a verified-planning item, not a spontaneous stop. ${practicalBase}`,
    coast: `Plan this stop around daylight, weather, sea conditions, and reliable transport. For families, avoid isolated stretches, confirm facilities in advance, and keep the visit simple: views, a walk, tea or snacks, then an unhurried return.`,
    culture: `Because programming changes, the editorial value depends on verification close to the visit date. Check event listings, entry rules, opening hours, and whether the venue is suitable for children or mixed-age family groups.`,
    dayTrip: `Start early, keep the route conservative, and avoid turning the day into a rushed checklist. A driver, water, phone signal planning, and a clear return window matter more here than squeezing in extra stops.`,
    family: `For families, the winning formula is modest: verify the facilities, go outside peak heat where possible, carry water, and combine the stop with one easy meal or mall break rather than a long cross-city chain.`,
    food: `Go with a trusted local recommendation or recent reviews, especially for hygiene, family seating, and opening hours. Evening visits usually carry more atmosphere, but traffic and parking can shape the experience as much as the food.`,
    general: practicalBase,
    heritage: `This is best experienced with patience and a light footprint: look at the building, read the street, then move through the area with awareness of traffic, security, and photography rules. ${practicalBase}`,
    mall: `Use it strategically: a cool midday pause, a dependable meal, a child-friendly reset, or a shopping errand between more demanding stops. Recent opening hours, cinema or play-area operations, and parking still need checking.`,
    market: `Go during active hours, keep valuables discreet, and avoid turning the visit into a long wander if travelling with children. A local guide or driver can make the stop more comfortable, especially for first-time visitors.`,
    museum: `Verify opening days, ticketing, photography rules, and any school-group or security restrictions before arrival. Museums in Karachi can be excellent, but hours and access are not always as predictable as the listing suggests.`,
    park: `Go early or near sunset, and verify maintenance, lighting, restrooms, playgrounds, and current access. In Karachi, even a simple park stop works best when it is connected to the surrounding neighbourhood plan.`,
    sacred: `Visitors should confirm access, dress expectations, and crowd patterns, especially around religious dates or prayer times. Keep photography restrained and let the place's devotional rhythm set the pace of the visit.`,
  };

  return [
    firstParagraphs[group] ?? firstParagraphs.general,
    secondParagraphs[group] ?? practicalBase,
  ];
};

const arabicSubject = (row: GuideItemRow) => {
  const title = clean(row.arabic_title) || row.title;
  const area = clean(row.arabic_area) || clean(row.area) || "كراتشي";
  const type =
    clean(row.arabic_category) ||
    clean(row.category) ||
    (row.kind === "family" ? "وجهة عائلية" : "محطة سياحية");
  return { area, title, type };
};

const arabicSummary = (row: GuideItemRow, group: string) => {
  const { area, title } = arabicSubject(row);
  const arabicType = arabicSubject(row).type;
  const purpose = arabicFamilyPurpose(row);

  const summaries: Record<string, string> = {
    campus: `يمثّل ${title} علامة من علامات الحياة التعليمية في ${area}، ويُقرأ ضمن سياق المدينة الأكاديمي والمهني أكثر من كونه مزارًا عابرًا؛ لذا ينبغي التحقق من إمكان الدخول قبل الزيارة.`,
    coast: `يقدّم ${title} إطلالة بحرية على إيقاع كراتشي الساحلي، مناسبًا للهواء الطلق ومشاهدة الغروب وتخفيف وتيرة الرحلة، مع ضرورة التحقق من الطقس والمدّ والوصول قبل الانطلاق.`,
    culture: `يُبرز ${title} جانبًا من الحياة الثقافية في ${area}، من المعارض والفعاليات إلى البرامج الفنية والمدنية؛ وتزداد قيمة الزيارة حين تُربط بفعالية قائمة ومواعيد مؤكدة.`,
    dayTrip: `يصلح ${title} كامتداد ليوم خارج قلب كراتشي، يجمع بين التراث أو الساحل أو المشهد الطبيعي، شريطة تنظيم النقل والعودة والوجبات وساعات النهار بعناية.`,
    family: `يصلح ${title} كمحطة عائلية عملية في كراتشي من أجل ${purpose}، على أن تُستخدم بساعات مؤكدة واستراحات مظللة ووجبات خفيفة ومسار يتجنب إرهاق عبور المدينة.`,
    food: `يمثّل ${title} إحدى مناطق الطعام في ${area}، حيث تظهر كراتشي في الشاي والوجبات السريعة والمطاعم العائلية وحركة المساء، مع أهمية الاعتماد على توصيات حديثة.`,
    general: `يمنح ${title} زائر كراتشي نافذة محددة على إيقاع ${area}، ويُفضّل إدراجه ضمن مسار حيّ متكامل بدل التعامل معه كمحطة منفصلة عن محيطها.`,
    heritage: `يشكّل ${title} جزءًا من ذاكرة ${area} العمرانية، حيث تتقاطع طبقات كراتشي المدنية والتجارية والمينائية مع حركة الشارع اليومية وكثافة المدينة المعاصرة.`,
    mall: `يُعد ${title} محطة تسوق وطعام مكيّفة في ${area}، نافعة للعائلات واستراحات منتصف اليوم والمرافق الموثوقة بين مسارات كراتشي الأكثر ازدحامًا.`,
    market: `يقدّم ${title} صورة حية لتجارة كراتشي في ${area}: ممرات مزدحمة، محال صغيرة، وحركة بيع يومية، وهي تجربة تحتاج خطة واضحة وصبرًا مع الزحام.`,
    museum: `يمنح ${title} زيارة منظمة داخل ${area} بوصفه ${arabicType}، مناسبًا للتاريخ أو المقتنيات أو التصميم أو التعلم العائلي بعيدًا عن إرهاق التنقل الطويل.`,
    park: `يوفّر ${title} متنفسًا أخضر في ${area}، مناسبًا للمشي المبكر واستراحة العائلة وإعادة ضبط إيقاع اليوم بين الأسواق والمتاحف ومحطات الساحل.`,
    sacred: `يمثّل ${title} محطة ذات أهمية روحية في ${area}، وينبغي التعامل معها باحترام ولباس محتشم ووعي بأوقات الصلاة والحشود وطبيعة المكان التعبدية.`,
  };

  return summaries[group] ?? summaries.general;
};

const arabicOverview = (row: GuideItemRow, group: string) => {
  const { area, title } = arabicSubject(row);
  const purpose = arabicFamilyPurpose(row);
  const practicalBase =
    "قبل الزيارة، ينبغي مراجعة رابط الخريطة وساعات العمل الحالية ومسار الوصول والسياق المحلي القريب. وتنجح زيارة كراتشي غالبًا حين تُخطط حسب الأحياء، بحيث تُقرن هذه المحطة بمطعم أو سوق أو متحف أو مسار ساحلي قريب بدل عبور المدينة لمحطة واحدة فقط.";

  const firstParagraphs: Record<string, string> = {
    campus: `يقع ${title} في ${area} ضمن طبقة كراتشي التعليمية والمؤسسية. ليست قيمته الأساسية في كونه معلمًا سياحيًا تقليديًا، بل في فهم المدينة بوصفها مركزًا للجامعات والمهن والذاكرة المدنية.`,
    coast: `يدخل ${title} بحر العرب إلى برنامج كراتشي بصورة مباشرة. قيمته ليست في الرفاه المصقول، بل في الأفق المفتوح، وحركة العائلات، وتبدل الضوء، وعادة المدينة في الاتجاه نحو الماء حين يلين اليوم.`,
    culture: `ينتمي ${title} إلى طبقة كراتشي الثقافية: معارض، مكتبات، عروض، محاضرات، وبرامج فنية تكشف وجهًا أبعد من الشواطئ والأسواق. تكون الزيارة في أفضل حالاتها حين تتزامن مع معرض أو فعالية قائمة.`,
    dayTrip: `يوسّع ${title} دليل كراتشي خارج المركز الحضري الكثيف. يناسب المسافر الذي شاهد المحاور الأساسية ويريد يومًا أطول حول التراث أو الساحل أو المشهد الطبيعي أو إيقاع أكثر هدوءًا.`,
    family: `ينجح ${title} عندما يُعامل كمحطة عائلية مرنة لا كبرنامج مرهق. قيمته في ${purpose}، مع إبقاء يوم كراتشي قابلاً للإدارة وسط الحر والازدحام وطول التنقلات.`,
    food: `ينتمي ${title} إلى ثقافة الطعام اليومية في كراتشي، حيث تُقرأ المدينة أحيانًا عبر الشواء والوجبات الخفيفة والشاي والطاولات العائلية وحركة المساء أكثر مما تُقرأ عبر المعالم وحدها.`,
    general: `يستحق ${title} الحضور في دليل كراتشي لأنه يكشف شريحة محددة من المدينة لا مجرد معلم عام. وتكون فائدته أكبر حين يُفهم ضمن مسار ${area} وما يحيط به من حركة وأحياء.`,
    heritage: `يساعد ${title} في قراءة الذاكرة العمرانية لمنطقة ${area}. فما زالت أحياء كراتشي المدنية والمينائية والتجارية تحمل طبقات من التاريخ الاستعماري وما بعد الاستقلال، حتى حين تبدو الشوارع حولها صاخبة ومرتجلة.`,
    mall: `يُعد ${title} محطة عملية بقدر ما هو وجهة تسوق. ففي مدينة حارة وكثيفة مثل كراتشي، قد تصنع التكييفات، وقاعات الطعام، ودورات المياه، والأمن، ومرافق العائلة فارقًا كبيرًا في راحة المسار.`,
    market: `لا يقدّم ${title} تجربة مصقولة على طريقة المتاجر المختارة؛ بل يقدّم كراتشي العاملة. توقّع ممرات مزدحمة، مساومة، توريدات، ومحال صغيرة تمنحك ملمس التجارة المحلية كما هي.`,
    museum: `يمنح ${title} يوم كراتشي قدرًا من التنظيم عبر المقتنيات والشرح والإيقاع الداخلي. وهو توازن مفيد أمام الشواطئ والأسواق والتنقلات الطويلة في الهواء الطلق.`,
    park: `يوفّر ${title} نوعًا من الهدوء الذي تحتاجه برامج كراتشي كثيرًا. استخدمه للمشي المبكر، أو استراحة عائلية، أو انتقال لطيف بين الأحياء قبل العودة إلى الشوارع الأكثر ازدحامًا.`,
    sacred: `ينتمي ${title} إلى المشهد الديني الحي في كراتشي؛ لذلك ينبغي أن تكون الزيارة مراقِبة ومحترمة لا سياحية صرفة. اللباس المحتشم، وخفض الصوت، ومراعاة أوقات الصلاة وآداب المكان أمور أساسية.`,
  };

  const secondParagraphs: Record<string, string> = {
    campus: `قد يكون الدخول مقيّدًا أو خاضعًا لتصريح، لذلك يُدرج ${title} كعنصر يحتاج تحققًا مسبقًا لا كوقفة عفوية. ${practicalBase}`,
    coast: "خطط لهذه المحطة وفق ضوء النهار والطقس وحالة البحر ووسيلة النقل الموثوقة. وللعائلات، يُفضّل تجنب المناطق المعزولة، والتأكد من المرافق، والاكتفاء بمشاهدة المنظر والمشي وتناول الشاي أو وجبة خفيفة ثم العودة بهدوء.",
    culture: "نظرًا إلى تغير البرامج، تعتمد قيمة الزيارة على التحقق القريب من تاريخ الرحلة. راجع الفعاليات، وشروط الدخول، وساعات العمل، ومدى ملاءمة المكان للأطفال أو المجموعات العائلية المختلطة.",
    dayTrip: "ابدأ مبكرًا، واجعل المسار محافظًا، ولا تحوّل اليوم إلى قائمة مزدحمة. السائق الموثوق، والماء، وخطة الاتصال، ووقت العودة الواضح أهم من إضافة محطات كثيرة.",
    family: "للعائلات، تكمن الوصفة الناجحة في البساطة: تحقق من المرافق، تجنّب ذروة الحر ما أمكن، احمل الماء، واربط المحطة بوجبة سهلة أو استراحة مكيّفة بدل سلسلة طويلة عبر المدينة.",
    food: "اعتمد على توصية محلية موثوقة أو مراجعات حديثة، ولا سيما في ما يتعلق بالنظافة، وجلوس العائلات، وساعات العمل. الزيارة المسائية تمنح أجواء أفضل غالبًا، لكن الحركة ومواقف السيارات قد تحدد التجربة بقدر الطعام نفسه.",
    general: practicalBase,
    heritage: `تُقرأ هذه المحطة بصبر وبحضور خفيف: انظر إلى المبنى، واقرأ الشارع، ثم تحرك بوعي للمرور والأمن وقواعد التصوير. ${practicalBase}`,
    mall: "استخدمه بذكاء: استراحة مكيّفة في منتصف اليوم، وجبة مضمونة، تهدئة للأطفال، أو مهمة تسوق بين محطات أكثر إرهاقًا. ومع ذلك، تبقى ساعات العمل وتشغيل السينما أو مناطق اللعب ومواقف السيارات بحاجة إلى تحقق حديث.",
    market: "اذهب في ساعات النشاط، واجعل المقتنيات الشخصية غير لافتة، ولا تطل التجول إذا كنت مع أطفال. وجود سائق أو مرافق محلي يجعل التجربة أريح، خصوصًا لمن يزور كراتشي للمرة الأولى.",
    museum: "تحقق من أيام العمل والتذاكر وقواعد التصوير وأي قيود أمنية أو زيارات مدرسية قبل الوصول. قد تكون متاحف كراتشي ممتازة، لكن المواعيد وإمكان الدخول ليست دائمًا بالثبات الذي توحي به القائمة.",
    park: "اذهب في الصباح الباكر أو قرب الغروب، وتحقق من الصيانة والإضاءة ودورات المياه ومناطق اللعب وإمكان الدخول الحالي. في كراتشي، حتى الحديقة البسيطة تنجح أكثر حين ترتبط بخطة الحي المحيط.",
    sacred: "ينبغي للزائر التحقق من إمكان الدخول وتوقعات اللباس وأنماط الزحام، وخصوصًا في المناسبات الدينية أو حول أوقات الصلاة. اجعل التصوير محدودًا ودع الإيقاع التعبدي للمكان يحدد وتيرة الزيارة.",
  };

  return [firstParagraphs[group] ?? firstParagraphs.general, secondParagraphs[group] ?? practicalBase];
};

const buildCopy = (row: GuideItemRow) => {
  const group = classify(row);
  const copy = {
    summary: englishSummary(row, group),
    overview: englishOverview(row, group),
    arabicSummary: arabicSummary(row, group),
    arabicOverview: arabicOverview(row, group),
  };

  return copySchema.parse(copy);
};

const addField = (
  updates: string[],
  values: unknown[],
  column: string,
  value: unknown,
) => {
  values.push(value);
  updates.push(`${column} = $${values.length}`);
};

const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await db.connect();

let scanned = 0;
let touched = 0;
let bodyAdded = 0;
let summaryUpdated = 0;
let arabicSummaryUpdated = 0;
let arabicOverviewAdded = 0;
let sourceRowsAdded = 0;

try {
  const cityResult = await db.query<{ id: number }>(
    "select id from payload.cities where slug = $1 limit 1",
    ["karachi"],
  );
  const cityId = cityResult.rows[0]?.id;
  if (!cityId) throw new Error("Karachi city row not found.");

  const result = await db.query<GuideItemRow>(
    `select id, kind::text as kind, slug, title, summary, body,
            arabic_title, arabic_summary, arabic_overview,
            arabic_area, arabic_category, area, category,
            map_url, imported_details, workflow_status, _status
       from payload.guide_items
      where city_id = $1 and kind::text in ('place', 'family')
      order by kind::text, id`,
    [cityId],
  );

  for (const row of result.rows) {
    scanned += 1;

    const refreshableReview = refreshReview && row.workflow_status === "review";
    const missingBody = !hasLexicalBody(row.body);
    const generatedEnglishBody = hasGeneratedEnglishBody(row.body);
    const weakSummary = wordCount(row.summary) < 12;
    const missingArabicOverview = !hasArabic(row.arabic_overview);
    const generatedArabicOverview = hasGeneratedArabicOverview(row.arabic_overview);
    const weakArabicSummary =
      !hasArabic(row.arabic_summary) || clean(row.arabic_summary).length < 90;

    if (
      !refreshableReview &&
      !missingBody &&
      !weakSummary &&
      !missingArabicOverview &&
      !weakArabicSummary
    ) {
      continue;
    }

    const copy = buildCopy(row);
    const updates: string[] = [];
    const values: unknown[] = [];

    if (weakSummary || refreshableReview) {
      addField(updates, values, "summary", copy.summary);
      summaryUpdated += 1;
    }

    if (missingBody || (refreshableReview && generatedEnglishBody)) {
      addField(updates, values, "body", bodyToLexical(copy.overview, "ltr"));
      bodyAdded += 1;
    }

    if (weakArabicSummary || refreshableReview) {
      addField(updates, values, "arabic_summary", copy.arabicSummary);
      arabicSummaryUpdated += 1;
    }

    if (missingArabicOverview || (refreshableReview && generatedArabicOverview)) {
      addField(updates, values, "arabic_overview", copy.arabicOverview.join("\n\n"));
      arabicOverviewAdded += 1;
    }

    addField(updates, values, "workflow_status", "review");
    addField(updates, values, "updated_at", new Date());

    if (!dryRun) {
      values.push(row.id);
      await db.query(
        `update payload.guide_items
            set ${updates.join(", ")}
          where id = $${values.length}`,
        values,
      );

      const sourceCount = await db.query<{ count: string }>(
        "select count(*) from payload.guide_items_sources where _parent_id = $1",
        [row.id],
      );

      if (Number(sourceCount.rows[0]?.count ?? 0) === 0) {
        const sourceUrl =
          typeof row.imported_details?.legacy_irhal_source_url === "string"
            ? row.imported_details.legacy_irhal_source_url
            : row.map_url;
        if (sourceUrl) {
          const sourceType =
            typeof row.imported_details?.legacy_irhal_source_url === "string"
              ? "editorial"
              : "map-provider";
          await db.query(
            `insert into payload.guide_items_sources
              (_order, _parent_id, id, label, url, type, verified_at, confidence)
             values
              (0, $1, gen_random_uuid()::text, $2, $3, $4::payload.enum_guide_items_sources_type, $5::timestamptz, $6::payload.enum_guide_items_sources_confidence)`,
            [
              row.id,
              sourceType === "editorial"
                ? "Legacy Irhal editorial source"
                : "Google Maps search verification URL",
              sourceUrl,
              sourceType,
              verifiedAt,
              "medium",
            ],
          );
          sourceRowsAdded += 1;
        }
      }
    }

    touched += 1;
    console.log(`${dryRun ? "would update" : "updated"} ${row.kind}:${row.slug}`);
  }

  console.log(
    JSON.stringify(
      {
        arabicOverviewAdded,
        arabicSummaryUpdated,
        bodyAdded,
        dryRun,
        scanned,
        sourceRowsAdded,
        summaryUpdated,
        touched,
      },
      null,
      2,
    ),
  );
} finally {
  await db.end();
}
