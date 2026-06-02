import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString?: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => {
    connect: () => Promise<void>;
    end: () => Promise<void>;
    query: (
      text: string,
      values?: unknown[],
    ) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;
  };
};

const { getPayload } = await import("payload");
const { default: config } = await import("../src/payload.config");

const verificationDate = "2026-06-02T00:00:00.000Z";
const tmpDir = path.join(os.tmpdir(), "irhal-karachi-legacy-import");

type LegacyItem = {
  title: string;
  slug: string;
  kind: "place" | "family";
  sectionSlug: string;
  sectionId: number;
  sourceUrl: string;
  imageUrl: string;
  imageAlt: string;
  summary: string;
  body: string[];
  area: string;
  category: string;
  neighborhoodSlug: string;
  address: string;
  latitude: number;
  longitude: number;
  arabicTitle: string;
  arabicSummary: string;
  arabicOverview: string;
  arabicArea: string;
  arabicCategory: string;
  arabicAddress: string;
  seoTitle: string;
  seoDescription: string;
};

const legacyItems: LegacyItem[] = [
  {
    title: "Sindbad Amusement Park",
    slug: "sindbad-amusement-park",
    kind: "family",
    sectionSlug: "children-in-tow",
    sectionId: 268,
    sourceUrl:
      "https://irhal.com/travel-guide/karachi/places-to-visit/sindbad-amusement-park/",
    imageUrl:
      "https://irhal.com/wp-content/uploads/2008/04/image_stories_cities_Karachi_sindbad6.jpg",
    imageAlt: "Sindbad Amusement Park family rides in Karachi",
    summary:
      "A legacy Karachi family amusement stop with compact rides and old-school city nostalgia, best treated as a light children-focused outing.",
    body: [
      "Sindbad Amusement Park is one of Karachi's older family amusement names, remembered for compact rides, quick games, and an accessible city-park atmosphere. It is not a polished resort-style attraction; the appeal is its familiar local character and the way it fits into a shorter family outing.",
      "Use it as a flexible children's stop rather than a full-day plan. Families should confirm current opening status, ride availability, ticketing, and safety rules before travelling, because legacy amusement facilities can change operations without much notice.",
    ],
    area: "Gulshan-e-Iqbal",
    category: "Family amusement park",
    neighborhoodSlug: "gulshan-e-iqbal",
    address: "Gulshan-e-Iqbal, Karachi",
    latitude: 24.9156644,
    longitude: 67.0990284,
    arabicTitle: "منتزه سندباد الترفيهي",
    arabicSummary:
      "وجهة عائلية قديمة في كراتشي تناسب نزهة قصيرة للأطفال، مع ضرورة التحقق من ساعات العمل وحالة الألعاب قبل الزيارة.",
    arabicOverview:
      "يُعد منتزه سندباد الترفيهي من الأسماء العائلية القديمة في كراتشي، ويرتبط في ذاكرة السكان بألعاب مدمجة وأجواء محلية بسيطة تصلح لوقفة خفيفة مع الأطفال.\n\nلا ينبغي التعامل معه كوجهة ترفيهية فاخرة أو برنامج يوم كامل، بل كنزهة قصيرة ضمن مسار عائلي في المدينة. ويُستحسن التأكد من ساعات العمل، وتوافر الألعاب، وأسعار التذاكر، وإرشادات السلامة قبل التوجه إليه.",
    arabicArea: "غلشن إقبال",
    arabicCategory: "منتزه ترفيهي عائلي",
    arabicAddress: "غلشن إقبال، كراتشي",
    seoTitle: "Sindbad Amusement Park Karachi | Family Guide",
    seoDescription:
      "Plan a short family stop at Sindbad Amusement Park in Karachi with location, visitor notes, and legacy Irhal source context.",
  },
  {
    title: "Saint Patrick's Cathedral",
    slug: "saint-patricks-cathedral",
    kind: "place",
    sectionSlug: "places-to-visit",
    sectionId: 262,
    sourceUrl:
      "https://irhal.com/travel-guide/karachi/places-to-visit/saint-patricks-cathedral/",
    imageUrl:
      "https://irhal.com/wp-content/uploads/2008/04/image_stories_cities_Karachi_Karachi_St__Patricks_Cathedral.jpg",
    imageAlt: "Saint Patrick's Cathedral in Saddar, Karachi",
    summary:
      "A major Roman Catholic cathedral in Saddar and one of Karachi's most recognisable colonial-era religious landmarks.",
    body: [
      "Saint Patrick's Cathedral stands in Saddar as one of Karachi's most important Christian landmarks. The present cathedral was inaugurated in the late nineteenth century, after an earlier church on the site became too small for the city's growing Catholic community.",
      "The building is valued for its Gothic Revival character, tall proportions, stained-glass details, and civic visibility in old Karachi. Visitors usually experience it as part of a Saddar heritage route, with respectful conduct and current access rules especially important around worship times and security checks.",
    ],
    area: "Saddar",
    category: "Cathedral / heritage landmark",
    neighborhoodSlug: "saddar",
    address: "Shahrah-e-Iraq, Saddar, Karachi",
    latitude: 24.8618056,
    longitude: 67.0348294,
    arabicTitle: "كاتدرائية القديس باتريك",
    arabicSummary:
      "معلم كاثوليكي بارز في منطقة صدر، ويُعد من أهم شواهد كراتشي الدينية والمعمارية من الحقبة الاستعمارية.",
    arabicOverview:
      "تقع كاتدرائية القديس باتريك في منطقة صدر، وتُعد من أبرز المعالم المسيحية في كراتشي. افتُتح مبناها الحالي في أواخر القرن التاسع عشر بعد أن أصبحت الكنيسة الأقدم في الموقع غير كافية للجالية الكاثوليكية المتنامية في المدينة.\n\nتلفت الكاتدرائية الانتباه بطابعها القوطي، وارتفاعاتها الواضحة، وتفاصيل الزجاج الملوّن، وحضورها المدني في قلب كراتشي القديمة. وتناسب الزيارة مساراً تراثياً في صدر، مع مراعاة آداب المكان والتحقق من قواعد الدخول، خصوصاً خلال أوقات العبادة أو عند وجود ترتيبات أمنية.",
    arabicArea: "صدر",
    arabicCategory: "كاتدرائية / معلم تراثي",
    arabicAddress: "شارع العراق، صدر، كراتشي",
    seoTitle: "Saint Patrick's Cathedral Karachi | Heritage Landmark",
    seoDescription:
      "Visit Saint Patrick's Cathedral in Karachi's Saddar district with history, location, visitor notes, and source attribution.",
  },
  {
    title: "M.A. Jinnah Road",
    slug: "m-a-jinnah-road",
    kind: "place",
    sectionSlug: "places-to-visit",
    sectionId: 262,
    sourceUrl:
      "https://irhal.com/travel-guide/karachi/places-to-visit/m-a-jinnah-road/",
    imageUrl: "https://irhal.com/wp-content/uploads/2021/05/M-A-Jinnah-Road.jpg",
    imageAlt: "M.A. Jinnah Road heritage corridor in Karachi",
    summary:
      "Karachi's historic Bunder Road corridor, now M.A. Jinnah Road, connecting old port-era streets with civic and commercial landmarks.",
    body: [
      "M.A. Jinnah Road is one of Karachi's defining urban corridors. Formerly known as Bunder Road, it grew around the port-facing city and still links many of the old commercial, civic, and heritage layers that shaped Karachi's public life.",
      "For travellers, the road is best understood as a heritage spine rather than a single stop. It connects markets, old institutional buildings, religious landmarks, traffic-heavy junctions, and everyday street life, so it works well as part of a guided or carefully planned old-city route.",
    ],
    area: "M.A. Jinnah Road",
    category: "Historic corridor",
    neighborhoodSlug: "m-a-jinnah-road",
    address: "M.A. Jinnah Road, Karachi",
    latitude: 24.8609668,
    longitude: 67.0179519,
    arabicTitle: "شارع إم. إيه. جناح",
    arabicSummary:
      "محور تاريخي رئيسي في كراتشي، عُرف سابقاً باسم بندر رود، ويربط بين ملامح المدينة القديمة وأسواقها ومبانيها المدنية.",
    arabicOverview:
      "يُعد شارع إم. إيه. جناح أحد المحاور الحضرية الأهم في كراتشي. وكان يُعرف سابقاً باسم بندر رود، وقد ارتبط بنمو المدينة حول الميناء وبشبكة التجارة والمؤسسات المدنية التي شكّلت وجه كراتشي العام.\n\nللمسافر، لا يُقرأ الشارع كمعلم منفرد بقدر ما يُفهم كعمود تراثي يربط الأسواق، والمباني القديمة، والمعالم الدينية، والتقاطعات الحيوية، وحركة الحياة اليومية. لذلك يناسب مساراً منظماً في المدينة القديمة، خصوصاً مع مراعاة الازدحام وسلامة التنقل.",
    arabicArea: "شارع إم. إيه. جناح",
    arabicCategory: "محور تاريخي",
    arabicAddress: "شارع إم. إيه. جناح، كراتشي",
    seoTitle: "M.A. Jinnah Road Karachi | Historic Corridor",
    seoDescription:
      "Explore M.A. Jinnah Road, Karachi's historic Bunder Road corridor, with heritage context, visitor notes, and map-ready details.",
  },
];

const bodyToLexical = (paragraphs: string[]) => ({
  root: {
    type: "root" as const,
    format: "" as const,
    indent: 0,
    version: 1,
    direction: "ltr" as const,
    children: paragraphs.map((paragraph) => ({
      type: "paragraph" as const,
      format: "" as const,
      indent: 0,
      version: 1,
      direction: "ltr" as const,
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

const safeFilename = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

async function downloadImage(url: string, slug: string) {
  await fs.mkdir(tmpDir, { recursive: true });
  const response = await fetch(url, {
    headers: {
      "user-agent": "IrhalLegacyImporter/1.0 (+https://irhal.com)",
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`);
  }
  const extension = path.extname(new URL(url).pathname) || ".jpg";
  const filePath = path.join(tmpDir, `${safeFilename(slug)}${extension}`);
  await fs.writeFile(filePath, Buffer.from(await response.arrayBuffer()));
  return filePath;
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await db.connect();

try {
  const cityRow = await db.query("select id from payload.cities where slug = $1", [
    "karachi",
  ]);
  const cityId = Number(cityRow.rows[0]?.id);
  if (!cityId) throw new Error("Karachi city row not found.");

  for (const item of legacyItems) {
    const existing = await db.query(
      "select id from payload.guide_items where city_id = $1 and kind = $2 and slug = $3 limit 1",
      [cityId, item.kind, item.slug],
    );
    if (existing.rows.length > 0) {
      console.log(`skip existing ${item.kind}:${item.slug}`);
      continue;
    }

    const neighborhood = await db.query(
      "select id from payload.neighborhoods where city_id = $1 and slug = $2 limit 1",
      [cityId, item.neighborhoodSlug],
    );
    const neighborhoodId = neighborhood.rows[0]?.id
      ? Number(neighborhood.rows[0].id)
      : undefined;

    const filename = `${item.slug}.webp`;
    let mediaId: number | undefined;
    const existingMedia = await db.query(
      "select id from payload.media where source_url = $1 or filename = $2 limit 1",
      [item.imageUrl, filename],
    );
    if (existingMedia.rows.length > 0) {
      mediaId = Number(existingMedia.rows[0].id);
    } else {
      const filePath = await downloadImage(item.imageUrl, item.slug);
      const created = await payload.create({
        collection: "media",
        filePath,
        data: {
          alt: item.imageAlt,
          caption: item.title,
          attribution: "Irhal legacy editorial archive",
          sourceUrl: item.imageUrl,
          license: "owned",
          usageStatus: "approved",
          usageNotes:
            "Imported from the in-house Irhal legacy WordPress archive during Karachi content recovery.",
        },
        overrideAccess: true,
      });
      mediaId = Number(created.id);
    }

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${item.latitude},${item.longitude}`,
    )}`;

    const created = await payload.create({
      collection: "guide-items",
      data: {
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        body: bodyToLexical(item.body),
        arabicTitle: item.arabicTitle,
        arabicSummary: item.arabicSummary,
        arabicOverview: item.arabicOverview,
        arabicArea: item.arabicArea,
        arabicCategory: item.arabicCategory,
        arabicAddress: item.arabicAddress,
        kind: item.kind,
        city: cityId,
        section: item.sectionId,
        sectionSlug: item.sectionSlug,
        image: mediaId,
        gallery: mediaId ? [{ image: mediaId }] : [],
        imageAlt: item.imageAlt,
        area: item.area,
        category: item.category,
        address: item.address,
        neighborhood: neighborhoodId,
        mapUrl,
        geoStatus: "verified",
        latitude: item.latitude,
        longitude: item.longitude,
        workflowStatus: "published",
        sources: [
          {
            label: "Irhal legacy Karachi guide",
            url: item.sourceUrl,
            type: "editorial",
            verifiedAt: verificationDate,
            confidence: "high",
          },
        ],
        importedDetails: {
          legacy_irhal_source_url: item.sourceUrl,
          legacy_irhal_verified_at: verificationDate,
          legacy_irhal_confidence: "high",
          import_batch: "2026-06-02-karachi-legacy-high-confidence",
        },
        seo: {
          title: item.seoTitle,
          description: item.seoDescription,
          robots: "index,follow",
          schemaType: item.kind === "family" ? "TouristAttraction" : "Place",
          openGraphImage: mediaId,
        },
        _status: "published",
      },
      overrideAccess: true,
    });

    console.log(`created ${item.kind}:${item.slug} -> #${created.id}`);
  }
} finally {
  await db.end();
}
