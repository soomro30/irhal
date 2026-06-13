import nextEnv from "@next/env";
import dns from "node:dns";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";

nextEnv.loadEnvConfig(process.cwd());
dns.setDefaultResultOrder("ipv4first");
process.env.IRHAL_SKIP_PAYLOAD_HOOK_REVALIDATE = "true";

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

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required.");
}

const baseDir =
  process.argv[2] || "/Users/zulfiqar/Downloads/2026-06-12 - 15 files";
const verifiedAt = "2026-06-12T00:00:00.000Z";

type ExistingTarget = {
  kind: "place" | "shopping" | "tour";
  slug: string;
};

type Asset = {
  alt: string;
  attribution: string;
  caption: string;
  copyright?: string;
  exifCreated?: string;
  filename: string;
  makeModel?: string;
  originalDescription: string;
  outputBase: string;
  photographer: string;
  primaryFor?: ExistingTarget[];
  galleryFor?: ExistingTarget[];
  sourceUrl?: string;
  software?: string;
};

const assets: Asset[] = [
  {
    alt: "London Eye and the River Thames looking towards Westminster, London",
    attribution: "VisitBritain",
    caption:
      "The London Eye, River Thames, and Palace of Westminster seen from central London.",
    exifCreated: "2024-10-16",
    filename: "VB8JQX.jpg",
    makeModel: "Canon EOS R5",
    originalDescription:
      "A view down the river Thames to the Houses of Parliament, Palace of Westminster and the London Eye",
    outputBase: "london-eye-thames-westminster-visitbritain",
    photographer: "VisitBritain",
    primaryFor: [{ kind: "place", slug: "london-eye" }],
    software: "Adobe Photoshop Lightroom Classic 13.5.1",
  },
  {
    alt: "Big Ben and the Houses of Parliament from Parliament Square, London",
    attribution: "VisitBritain",
    caption: "Big Ben and the Palace of Westminster seen across Parliament Square.",
    exifCreated: "2024-10-16",
    filename: "VB8JU2.jpg",
    makeModel: "Canon EOS R5",
    originalDescription:
      "Big Ben and the Houses of Parliament, Palace of Westminster see across Parliament Square",
    outputBase: "palace-westminster-big-ben-parliament-square-visitbritain",
    photographer: "VisitBritain",
    primaryFor: [
      { kind: "place", slug: "palace-of-westminster-and-elizabeth-tower" },
    ],
    software: "Adobe Photoshop 26.2",
  },
  {
    alt: "Parliament Square with Westminster buildings beyond, London",
    attribution: "VisitBritain",
    caption: "Parliament Square with the Westminster civic and parliamentary quarter beyond.",
    exifCreated: "2024-10-16",
    filename: "VB8JPO.jpg",
    makeModel: "Canon EOS R5",
    originalDescription: "Parliament Square with Westminster buildings beyond",
    outputBase: "palace-westminster-parliament-square-visitbritain",
    photographer: "VisitBritain",
    galleryFor: [
      { kind: "place", slug: "palace-of-westminster-and-elizabeth-tower" },
    ],
    software: "Adobe Photoshop 26.2",
  },
  {
    alt: "Borough market street scene in London",
    attribution: "VisitBritain",
    caption: "A busy street-market scene in Borough, London.",
    exifCreated: "2025-04-23",
    filename: "VB8IYX.jpg",
    originalDescription:
      "A woman stands in a busy shopping street, Borough, London.",
    outputBase: "borough-market-street-scene-visitbritain",
    photographer: "VisitBritain",
    primaryFor: [
      { kind: "place", slug: "borough-market" },
      { kind: "shopping", slug: "borough-market" },
    ],
    software: "Adobe Photoshop 26.2",
  },
  {
    alt: "Traveller boarding a red Routemaster bus in London",
    attribution: "VisitBritain",
    caption: "A traveller boarding a red Routemaster bus in London.",
    exifCreated: "2024-10-17",
    filename: "VB8JR2.jpg",
    makeModel: "Canon EOS R6m2",
    originalDescription:
      "A man stands on the back of a red route master bus in London",
    outputBase: "london-buses-routemaster-visitbritain",
    photographer: "VisitBritain",
    primaryFor: [{ kind: "tour", slug: "london-buses" }],
    software: "Adobe Photoshop Lightroom Classic 13.5.1",
  },
  {
    alt: "Tower Bridge and The Shard from the River Thames, London",
    attribution: "VisitBritain",
    caption: "Tower Bridge and The Shard seen from the River Thames.",
    exifCreated: "2024-10-16",
    filename: "VB8JTE.jpg",
    makeModel: "Canon EOS R6m2",
    originalDescription:
      "A view of the river Thames with landmarks beyond that include Tower Bridge and the Shard",
    outputBase: "tower-bridge-shard-thames-visitbritain",
    photographer: "VisitBritain",
    galleryFor: [{ kind: "place", slug: "tower-bridge" }],
    software: "Adobe Photoshop 26.5",
  },
  {
    alt: "Visitor outside St Paul's Cathedral in London",
    attribution: "VisitBritain",
    caption: "A visitor stands in front of St Paul's Cathedral in London.",
    exifCreated: "2025-05-15",
    filename: "VB8JKG.jpg",
    originalDescription:
      "A woman poses to camera as she stands in front of St Paul's Cathedral, London",
    outputBase: "st-pauls-cathedral-exterior-visitbritain",
    photographer: "VisitBritain",
    primaryFor: [{ kind: "place", slug: "st-paul-s-cathedral" }],
    software: "Adobe Photoshop 26.3",
  },
  {
    alt: "Westminster Bridge towards Big Ben and the Palace of Westminster, London",
    attribution: "VisitBritain",
    caption: "Westminster Bridge looking towards Big Ben and the Palace of Westminster.",
    exifCreated: "2024-10-17",
    filename: "VB8JY5.jpg",
    makeModel: "Canon EOS R6m2",
    originalDescription:
      "A view across Westminster Bridge toward Big Ben and the Houses of Parliament, Palace of Westminster",
    outputBase: "palace-westminster-westminster-bridge-visitbritain",
    photographer: "VisitBritain",
    galleryFor: [
      { kind: "place", slug: "palace-of-westminster-and-elizabeth-tower" },
    ],
    software: "Adobe Photoshop 26.2",
  },
  {
    alt: "Spiral staircase inside St Paul's Cathedral, London",
    attribution: "VisitBritain",
    caption: "A visitor looks up an ornate spiral stone staircase inside St Paul's Cathedral.",
    exifCreated: "2024-10-17",
    filename: "VB8JON.jpg",
    makeModel: "vivo X100 Ultra",
    originalDescription:
      "A man reaches up as he looks up to an ornate spiral stone staircase, in St Paul's Cathedral in London",
    outputBase: "st-pauls-cathedral-spiral-staircase-visitbritain",
    photographer: "VisitBritain",
    galleryFor: [{ kind: "place", slug: "st-paul-s-cathedral" }],
    software: "Android Gallery",
  },
  {
    alt: "The Academy Hotel Georgian townhouse exterior in Bloomsbury, London",
    attribution: "The Academy Hotel",
    caption: "The five Georgian townhouses that form The Academy Hotel in London's West End.",
    exifCreated: "2019-04-06",
    filename: "VB8SXF.jpg",
    originalDescription:
      "The five Georgian townhouses that form The Academy Hotel, in London's West End.",
    outputBase: "the-academy-hotel-bloomsbury-exterior",
    photographer: "The Academy Hotel",
    sourceUrl: "https://www.theacademyhotel.co.uk/",
  },
  {
    alt: "Bloomsbury Suite living area at The Academy Hotel, London",
    attribution: "The Academy Hotel",
    caption: "The Bloomsbury Suite at The Academy Hotel in London's West End.",
    exifCreated: "2018-03-14",
    filename: "VB8T26.jpg",
    originalDescription:
      "The Bloomsbury Suite at The Academy Hotel, in London's West End.",
    outputBase: "the-academy-hotel-bloomsbury-suite",
    photographer: "The Academy Hotel",
    sourceUrl: "https://www.theacademyhotel.co.uk/",
  },
  {
    alt: "Afternoon tea service at The Academy Hotel, London",
    attribution: "The Academy Hotel / Ferla Paolo Photography",
    caption: "Afternoon tea service at The Academy Hotel in Bloomsbury.",
    copyright: "free to use - Ferla Paolo Photography",
    exifCreated: "2019-05-09",
    filename: "VB8SZG.jpg",
    originalDescription: "www.ferlapaolo.com",
    outputBase: "the-academy-hotel-afternoon-tea-ferla-paolo",
    photographer: "Ferla Paolo Photography",
    sourceUrl: "https://www.theacademyhotel.co.uk/",
  },
  {
    alt: "Bloomsbury Double room at The Academy Hotel, London",
    attribution: "The Academy Hotel",
    caption: "The Bloomsbury Double room at The Academy Hotel in London's West End.",
    exifCreated: "2025-06-11",
    filename: "VB8T4P.jpg",
    originalDescription:
      "The Bloomsbury Double room at The Academy Hotel, in London's West End.",
    outputBase: "the-academy-hotel-bloomsbury-double-room",
    photographer: "The Academy Hotel",
    sourceUrl: "https://www.theacademyhotel.co.uk/",
  },
  {
    alt: "Threadneedles Hotel exterior in the City of London",
    attribution: "Threadneedles London",
    caption: "External view of Threadneedles Hotel in central London.",
    exifCreated: "2025-06-13",
    filename: "VB8SP1.jpg",
    originalDescription:
      "The external view at the Threadneedles Hotel five star boutique hotel in central London.",
    outputBase: "threadneedles-hotel-city-london-exterior",
    photographer: "Threadneedles London",
    sourceUrl:
      "https://www.marriott.com/en-us/hotels/lonak-threadneedles-autograph-collection/overview/",
  },
  {
    alt: "Penthouse suite at Threadneedles Hotel, London",
    attribution: "Threadneedles London",
    caption: "The Penthouse at Threadneedles Hotel in central London.",
    exifCreated: "2026-06-12",
    filename: "VB8SUQ.jpg",
    originalDescription:
      "The Penthouse at the Threadneedles five star boutique hotel in central London.",
    outputBase: "threadneedles-hotel-penthouse-suite",
    photographer: "Threadneedles London",
    sourceUrl:
      "https://www.marriott.com/en-us/hotels/lonak-threadneedles-autograph-collection/overview/",
  },
];

const hotelMedia = {
  "the-academy-hotel": {
    primary: "the-academy-hotel-bloomsbury-exterior",
    gallery: [
      "the-academy-hotel-bloomsbury-double-room",
      "the-academy-hotel-bloomsbury-suite",
      "the-academy-hotel-afternoon-tea-ferla-paolo",
    ],
  },
  "threadneedles-hotel": {
    primary: "threadneedles-hotel-city-london-exterior",
    gallery: ["threadneedles-hotel-penthouse-suite"],
  },
};

const lexicalFromParagraphs = (paragraphs: string[] = [], direction = "ltr") => ({
  root: {
    type: "root",
    format: "",
    indent: 0,
    version: 1,
    direction: null,
    children: paragraphs
      .map((paragraph) => paragraph.trim())
      .filter(Boolean)
      .map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction,
        textFormat: 0,
        textStyle: "",
        children: [
          {
            type: "text",
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: paragraph,
            version: 1,
          },
        ],
      })),
  },
});

const payload = await getPayload({ config });
const db = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const sourcePath = (asset: Asset) => path.join(baseDir, asset.filename);
const outputPath = (asset: Asset) =>
  path.join(os.tmpdir(), `${asset.outputBase}${path.extname(asset.filename)}`);

const usageNotes = (asset: Asset) =>
  [
    `Supplied file ${asset.filename}.`,
    `Embedded description: ${asset.originalDescription}.`,
    asset.copyright ? `Embedded copyright: ${asset.copyright}.` : undefined,
    asset.makeModel ? `Camera: ${asset.makeModel}.` : undefined,
    asset.software ? `Software: ${asset.software}.` : undefined,
    asset.exifCreated ? `Metadata creation date: ${asset.exifCreated}.` : undefined,
    "Rights note: asset supplied for Irhal editorial use; retain stored attribution and copyright metadata during review.",
  ]
    .filter(Boolean)
    .join(" ");

const unique = (values: number[]) => [...new Set(values.filter(Boolean))];

const findGuideItem = async (kind: string, slug: string) => {
  const result = await db.query(
    `select id, image_id
       from payload.guide_items
      where city_id = (select id from payload.cities where slug = 'london' limit 1)
        and kind = $1
        and slug = $2
      limit 1`,
    [kind, slug],
  );
  return result.rows[0] as { id: number; image_id: number | null } | undefined;
};

const currentGalleryIds = async (itemId: number) => {
  const result = await db.query(
    `select image_id
       from payload.guide_items_gallery
      where _parent_id = $1
      order by _order asc`,
    [itemId],
  );
  return result.rows
    .map((row) => Number(row.image_id))
    .filter((id) => Number.isFinite(id));
};

const updateGuideMedia = async ({
  galleryIds = [],
  kind,
  primaryId,
  primaryAlt,
  slug,
}: {
  galleryIds?: number[];
  kind: string;
  primaryAlt?: string;
  primaryId?: number;
  slug: string;
}) => {
  const item = await findGuideItem(kind, slug);
  if (!item) throw new Error(`Guide item not found: ${kind}/${slug}`);

  const existingGallery = await currentGalleryIds(item.id);
  const nextGallery = unique([
    ...existingGallery,
    ...(primaryId && item.image_id ? [Number(item.image_id)] : []),
    ...galleryIds,
  ]).filter((id) => id !== primaryId);

  const data: Record<string, unknown> = {
    gallery: nextGallery.map((image) => ({ image })),
  };
  if (primaryId) data.image = primaryId;
  if (primaryAlt) data.imageAlt = primaryAlt;

  await payload.update({
    collection: "guide-items" as never,
    id: item.id,
    data: data as never,
    overrideAccess: true,
  });

  console.log(
    JSON.stringify(
      { galleryIds: nextGallery, itemId: item.id, kind, primaryId, slug },
      null,
      2,
    ),
  );
};

const hotels = [
  {
    address: "21 Gower Street, Fitzrovia, London WC1E 6HG, United Kingdom",
    arabicAddress:
      "٢١ شارع غاور، فيتزروفيا، لندن WC1E 6HG، المملكة المتحدة",
    arabicArea: "بلومزبري / فيتزروفيا",
    arabicCategory: "فندق بوتيكي فاخر",
    arabicOverview:
      "يقع فندق ذا أكاديمي في مجموعة من خمسة منازل جورجية متجاورة في بلومزبري، وهي منطقة عملية لمن يريد الإقامة بين المتحف البريطاني، وشارع أكسفورد، وويست إند، مع الاحتفاظ بإحساس سكني أهدأ من قلب مناطق التسوق.\n\nيناسب الفندق المسافر الذي يفضل فندقاً بوتيكياً صغيراً على الفنادق الضخمة؛ فعدد الغرف والأجنحة محدود، والطابع الداخلي يمزج بين تفاصيل المنازل التاريخية وتجهيزات عصرية. للزائر المسلم، تكمن قيمة الموقع في سهولة الوصول إلى المطاعم الحلال في وسط لندن وإلى محطات المترو القريبة، مع ضرورة التحقق مسبقاً من خيارات الإفطار المناسبة، ومساحة الغرفة، وسياسة الأسرة الإضافية عند السفر مع العائلة.\n\nقبل الحجز، راجع أحدث صور الغرف، وشروط الإلغاء، ورسوم الخدمة، وأقرب محطة مترو مناسبة لبرنامجك اليومي. كما يُفضّل التواصل مع الفندق عند الحاجة إلى اتجاه القبلة أو متطلبات إقامة خاصة.",
    arabicSummary:
      "فندق بوتيكي فاخر في بلومزبري، يشغل خمسة منازل جورجية ويمنح الزائر موقعاً عملياً بين المتحف البريطاني وويست إند.",
    arabicTitle: "فندق ذا أكاديمي",
    area: "Bloomsbury / Fitzrovia",
    category: "Luxury boutique hotel",
    geo: { lat: 51.5205327, lon: -0.1307723, neighborhoodId: 696 },
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=The%20Academy%20Hotel%2021%20Gower%20Street%20London%20WC1E%206HG",
    overview: [
      "The Academy Hotel is a refined boutique stay in Bloomsbury, set across five Georgian townhouses on Gower Street. It works well for travellers who want a central London base with a quieter literary-neighbourhood feel rather than a large business hotel.",
      "The location is practical for the British Museum, Oxford Street, Covent Garden, and West End theatres, while nearby Underground links keep Westminster, South Kensington, and halal dining clusters within easy reach. Rooms and suites carry a townhouse character, so compare room sizes carefully when travelling with family or extra luggage.",
      "For Irhal readers, the main planning value is location, scale, and comfort. Confirm breakfast suitability, cancellation rules, room configuration, lift access, and whether the hotel can support prayer-direction requests before booking.",
    ],
    seoDescription:
      "The Academy Hotel is a luxury boutique hotel in Bloomsbury, London, set across Georgian townhouses near the British Museum and West End.",
    slug: "the-academy-hotel",
    sources: [
      {
        confidence: "high",
        label: "The Academy Hotel official website",
        type: "official",
        url: "https://www.theacademyhotel.co.uk/",
        verifiedAt,
      },
      {
        confidence: "high",
        label: "OpenStreetMap/Nominatim geocode",
        type: "map-provider",
        url: "https://nominatim.openstreetmap.org/",
        verifiedAt,
      },
    ],
    summary:
      "A luxury boutique hotel in Bloomsbury, set across five Georgian townhouses and useful for travellers who want the British Museum, Oxford Street, and West End theatres close by.",
    title: "The Academy Hotel",
  },
  {
    address: "5 Threadneedle Street, London EC2R 8AY, United Kingdom",
    arabicAddress: "٥ شارع ثريدنيدل، لندن EC2R 8AY، المملكة المتحدة",
    arabicArea: "سيتي أوف لندن",
    arabicCategory: "فندق بوتيكي خمس نجوم",
    arabicOverview:
      "يقع فندق ثريدنيدلز في مبنى تاريخي داخل سيتي أوف لندن، بالقرب من بانك، ليدنهول ماركت، ورويال إكستشينج. وهو خيار مناسب لمن يريد إقامة راقية في منطقة المال والأعمال مع وصول سريع إلى تاور بريدج، برج لندن، وسانت بول.\n\nالطابع العام للفندق أقرب إلى فندق بوتيكي فاخر منه إلى فندق عائلي كبير، لذلك يناسب الرحلات القصيرة، الإقامة المهنية، أو جدول زيارة يركّز على شرق ووسط لندن. على المسافر المسلم التحقق من خيارات الإفطار، وخدمات الغرف، والمسافة إلى أقرب مطاعم حلال أو مصلى، خصوصاً لأن سيتي أوف لندن تهدأ في بعض عطلات نهاية الأسبوع مقارنة بمناطق التسوق والسياحة.\n\nقبل تثبيت الحجز، راجع أحدث صور الغرف، وسياسة الإلغاء، ومداخل الفندق القريبة من محطة بانك، وأي رسوم إضافية. وإذا كانت الإقامة عائلية، فتأكد من سعة الغرفة وخيارات الأسرّة المتصلة أو الأجنحة.",
    arabicSummary:
      "فندق بوتيكي خمس نجوم في سيتي أوف لندن، مناسب للإقامة الراقية قرب بانك وليدنهول ماركت وبرج لندن.",
    arabicTitle: "فندق ثريدنيدلز",
    area: "City of London",
    category: "Five-star boutique hotel",
    geo: { lat: 51.5139786, lon: -0.085614, neighborhoodId: 683 },
    mapUrl:
      "https://www.google.com/maps/search/?api=1&query=Threadneedles%20Hotel%205%20Threadneedle%20Street%20London%20EC2R%208AY",
    overview: [
      "Threadneedles Hotel is a five-star boutique hotel in the City of London, close to Bank, Leadenhall Market, the Royal Exchange, and the historic lanes around Threadneedle Street.",
      "The hotel suits travellers who want a polished business-district base with quick access to Tower Bridge, the Tower of London, St Paul's Cathedral, and Liverpool Street. The setting is quieter on some weekends than the West End, which can be a benefit for short stays but should be considered when planning evening dining.",
      "For Muslim travellers, verify breakfast suitability, room-service options, nearby halal restaurants, and prayer-space needs before booking. Also check the latest room photos, cancellation terms, and the best Bank station exit for arrival with luggage.",
    ],
    seoDescription:
      "Threadneedles Hotel is a five-star boutique hotel in the City of London near Bank, Leadenhall Market, Tower Bridge, and the Tower of London.",
    slug: "threadneedles-hotel",
    sources: [
      {
        confidence: "high",
        label: "Marriott official Threadneedles page",
        type: "official",
        url: "https://www.marriott.com/en-us/hotels/lonak-threadneedles-autograph-collection/overview/",
        verifiedAt,
      },
      {
        confidence: "medium",
        label: "YTL Hotels United Kingdom portfolio",
        type: "official",
        url: "https://www.ytlhotels.com/hotels-and-resorts/united-kingdom/",
        verifiedAt,
      },
      {
        confidence: "high",
        label: "OpenStreetMap/Nominatim geocode",
        type: "map-provider",
        url: "https://nominatim.openstreetmap.org/",
        verifiedAt,
      },
    ],
    summary:
      "A five-star boutique hotel in the City of London, useful for Bank, Leadenhall Market, the Tower of London, Tower Bridge, and business-district stays.",
    title: "Threadneedles Hotel",
  },
];

await db.connect();

try {
  const cityResult = await db.query(
    `select id from payload.cities where slug = 'london' limit 1`,
  );
  const cityId = Number(cityResult.rows[0]?.id);
  if (!cityId) throw new Error("London city record not found.");

  const hotelsSection = await db.query(
    `select id from payload.guide_sections
      where city_id = $1 and section_slug = 'hotels'
      limit 1`,
    [cityId],
  );
  const hotelsSectionId = Number(hotelsSection.rows[0]?.id);
  if (!hotelsSectionId) throw new Error("London hotels section not found.");

  const mediaIdByOutputBase = new Map<string, number>();
  const assetByOutputBase = new Map(assets.map((asset) => [asset.outputBase, asset]));

  for (const asset of assets) {
    await fs.access(sourcePath(asset));
    await fs.copyFile(sourcePath(asset), outputPath(asset));

    const existing = await db.query(
      `select id
         from payload.media
        where filename like $1
        order by id desc
        limit 1`,
      [`${asset.outputBase}%`],
    );

    let mediaId = existing.rows[0]?.id ? Number(existing.rows[0].id) : undefined;

    const data = {
      alt: asset.alt,
      attribution: asset.attribution,
      caption: asset.caption,
      license: "partner-provided",
      photographer: asset.photographer,
      sourceUrl: asset.sourceUrl,
      usageNotes: usageNotes(asset),
      usageStatus: "approved",
    } as never;

    if (!mediaId) {
      const created = (await payload.create({
        collection: "media" as never,
        filePath: outputPath(asset),
        data,
        overrideAccess: true,
      })) as { id: number | string; url?: string };
      mediaId = Number(created.id);
      console.log(`uploaded ${asset.filename} -> media #${mediaId} ${created.url ?? ""}`);
    } else {
      await payload.update({
        collection: "media" as never,
        id: mediaId,
        data,
        overrideAccess: true,
      });
      console.log(`reused ${asset.filename} -> media #${mediaId}`);
    }

    mediaIdByOutputBase.set(asset.outputBase, mediaId);
  }

  for (const hotel of hotels) {
    const hotelAssets = hotelMedia[hotel.slug as keyof typeof hotelMedia];
    const primaryId = mediaIdByOutputBase.get(hotelAssets.primary);
    if (!primaryId) throw new Error(`Missing hotel primary media for ${hotel.slug}`);

    const primaryAsset = assetByOutputBase.get(hotelAssets.primary);
    if (!primaryAsset) throw new Error(`Missing hotel primary asset for ${hotel.slug}`);

    const galleryIds = hotelAssets.gallery
      .map((outputBase) => mediaIdByOutputBase.get(outputBase))
      .filter((id): id is number => typeof id === "number");

    const existing = await findGuideItem("hotel", hotel.slug);
    const commonData = {
      address: hotel.address,
      arabicAddress: hotel.arabicAddress,
      arabicArea: hotel.arabicArea,
      arabicCategory: hotel.arabicCategory,
      arabicOverview: hotel.arabicOverview,
      arabicSummary: hotel.arabicSummary,
      arabicTitle: hotel.arabicTitle,
      area: hotel.area,
      body: lexicalFromParagraphs(hotel.overview),
      category: hotel.category,
      city: cityId,
      gallery: galleryIds.map((image) => ({ image })),
      geoStatus: "verified",
      image: primaryId,
      imageAlt: primaryAsset.alt,
      importedDetails: {
        createdBy: "scripts/update-london-visitbritain-hotel-media.ts",
        editorialNote:
          "Targeted hotel addition requested by the user; copy is editorial guidance, not a paid recommendation.",
        photoFiles: [
          primaryAsset.filename,
          ...hotelAssets.gallery.map((outputBase) => assetByOutputBase.get(outputBase)?.filename),
        ].filter(Boolean),
      },
      kind: "hotel",
      latitude: hotel.geo.lat,
      longitude: hotel.geo.lon,
      mapUrl: hotel.mapUrl,
      neighborhood: hotel.geo.neighborhoodId,
      section: hotelsSectionId,
      sectionSlug: "hotels",
      seo: {
        description: hotel.seoDescription,
        robots: "index,follow",
        schemaType: "Hotel",
        title: `${hotel.title} | London`,
      },
      slug: hotel.slug,
      sourceRowId: `manual-london-hotel:${hotel.slug}`,
      sourceTable: "manual_london_hotels",
      sources: hotel.sources,
      summary: hotel.summary,
      title: hotel.title,
      workflowStatus: "review",
      _status: "published",
    };

    if (existing) {
      await payload.update({
        collection: "guide-items" as never,
        id: existing.id,
        data: commonData as never,
        overrideAccess: true,
      });
      console.log(`updated hotel ${hotel.slug} -> guide item #${existing.id}`);
    } else {
      const created = (await payload.create({
        collection: "guide-items" as never,
        data: commonData as never,
        overrideAccess: true,
      })) as { id: number | string };
      console.log(`created hotel ${hotel.slug} -> guide item #${created.id}`);
    }
  }

  for (const asset of assets) {
    const mediaId = mediaIdByOutputBase.get(asset.outputBase);
    if (!mediaId) throw new Error(`Missing media id for ${asset.outputBase}`);

    for (const target of asset.primaryFor ?? []) {
      await updateGuideMedia({
        kind: target.kind,
        primaryAlt: asset.alt,
        primaryId: mediaId,
        slug: target.slug,
      });
    }

    for (const target of asset.galleryFor ?? []) {
      await updateGuideMedia({
        galleryIds: [mediaId],
        kind: target.kind,
        slug: target.slug,
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        media: Object.fromEntries(mediaIdByOutputBase),
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
} finally {
  await db.end();
}
