import config from "../src/payload.config";
import { cities } from "../src/lib/city-data";
import { getGuideArticlesForSection, getGuideItems, sectionCards } from "../src/lib/guide-items";
import { getPayload } from "payload";

const city = cities.find((item) => item.slug === "karachi");

if (!city) {
  throw new Error("Karachi guide data was not found.");
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) {
  throw new Error("DATABASE_URL and PAYLOAD_SECRET are required to seed Payload CMS documents.");
}

const payload = await getPayload({ config });

const cityResult = await payload.find({
  collection: "cities" as never,
  limit: 1,
  where: {
    slug: {
      equals: city.slug,
    },
  },
});

const cityPayload = {
  name: city.name,
  slug: city.slug,
  country: city.country,
  region: city.region,
  locale: city.locale,
  lede: city.lede,
  timezone: city.timezone,
  languages: city.languages.map((language) => ({ language })),
  currency: city.currency,
  latitude: city.latitude,
  longitude: city.longitude,
  geo: [city.longitude, city.latitude],
  mapUrl: city.mapUrl,
  fastFacts: city.fastFacts,
  structuredSections: city.fullGuide,
  workflowStatus: "published",
  seo: city.seo,
  sources: [
    {
      label: city.fullGuide.source.fileName,
      url: "local-docx-import",
      type: "editorial",
      verifiedAt: "2026-05-25",
      confidence: "high",
    },
  ],
  lastVerifiedAt: "2026-05-25",
};

const cityDoc =
  cityResult.docs[0] ??
  (await payload.create({
    collection: "cities" as never,
    data: cityPayload as never,
  }));

if (cityResult.docs[0]) {
  await payload.update({
    collection: "cities" as never,
    id: cityResult.docs[0].id,
    data: cityPayload as never,
  });
}

const cityId = cityDoc.id;

for (const section of sectionCards) {
  const articles = getGuideArticlesForSection(city, section.slug);
  const existing = await payload.find({
    collection: "guide-sections" as never,
    limit: 1,
    where: {
      and: [{ sectionSlug: { equals: section.slug } }, { city: { equals: cityId } }],
    },
  });
  const data = {
    title: section.title,
    sectionSlug: section.slug,
    city: cityId,
    sectionType: ["places-to-visit", "hotels", "food-and-restaurants", "shopping", "organized-tours", "children-in-tow", "muslim-visitor-information"].includes(
      section.slug,
    )
      ? "directory"
      : "editorial",
    summary: section.summary,
    sourceImport: {
      articles: articles.map((article) => ({
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        blocks: article.blocks,
      })),
      sourceFile: city.fullGuide.source.fileName,
    },
    workflowStatus: "published",
    seo: {
      title: `${section.title} | ${city.name}`,
      description: section.summary,
      robots: "index,follow",
      schemaType: "Article",
    },
    sources: [
      {
        label: city.fullGuide.source.fileName,
        url: "local-docx-import",
        type: "editorial",
        verifiedAt: "2026-05-25",
        confidence: "high",
      },
    ],
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "guide-sections" as never,
      id: existing.docs[0].id,
      data: data as never,
    });
  } else {
    await payload.create({
      collection: "guide-sections" as never,
      data: data as never,
    });
  }
}

for (const item of getGuideItems(city)) {
  const existing = await payload.find({
    collection: "guide-items" as never,
    limit: 1,
    where: {
      and: [{ kind: { equals: item.kind } }, { slug: { equals: item.slug } }, { city: { equals: cityId } }],
    },
  });

  const data = {
    title: item.title,
    slug: item.slug,
    kind: item.kind,
    city: cityId,
    sectionSlug: item.sectionSlug,
    summary: item.description,
    imageAlt: item.imageAlt,
    area: item.area,
    category: item.category,
    budget: item.budget,
    mapUrl: item.mapUrl,
    geoStatus: item.geoStatus,
    importedDetails: item.details,
    sourceTable: item.sourceTable,
    sourceRowId: item.id,
    workflowStatus: "published",
    seo: {
      title: `${item.title} | ${city.name}`,
      description: item.description,
      robots: "index,follow",
      schemaType:
        item.kind === "restaurant" ? "Restaurant" : item.kind === "hotel" ? "Hotel" : item.kind === "festival" ? "Event" : "Place",
    },
    sources: [
      {
        label: city.fullGuide.source.fileName,
        url: "local-docx-import",
        type: "editorial",
        verifiedAt: "2026-05-25",
        confidence: "medium",
      },
    ],
  };

  if (existing.docs[0]) {
    await payload.update({
      collection: "guide-items" as never,
      id: existing.docs[0].id,
      data: data as never,
    });
  } else {
    await payload.create({
      collection: "guide-items" as never,
      data: data as never,
    });
  }
}

console.log(`Seeded ${sectionCards.length} guide sections and ${getGuideItems(city).length} guide items for ${city.name}.`);
