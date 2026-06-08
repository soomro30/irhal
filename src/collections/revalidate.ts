import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest,
} from "payload";

type CMSDoc = Record<string, unknown> & {
  id?: number | string;
};

const routeKindByGuideItemKind: Record<string, string> = {
  family: "family",
  festival: "festival",
  hotel: "hotel",
  masjid: "masjid",
  place: "place",
  restaurant: "restaurant",
  shopping: "shopping",
  tour: "tour",
};

const routeKindByListingType: Record<string, string> = {
  hotel: "hotel",
  "islamic-landmark": "place",
  masjid: "masjid",
  place: "place",
  "prayer-area": "masjid",
  restaurant: "restaurant",
  shopping: "shopping",
  tour: "tour",
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const relationshipId = (value: unknown) => {
  if (typeof value === "number" || typeof value === "string") return value;
  const record = asRecord(value);
  return record.id as number | string | undefined;
};

const relationshipSlug = (value: unknown) => asString(asRecord(value).slug);

const prefixedPaths = (path: string) => [
  path,
  `/en${path}`,
  `/ar${path}`,
];

const resolveCitySlug = async (
  collection: string,
  doc: CMSDoc,
  req: PayloadRequest,
): Promise<string | undefined> => {
  if (collection === "cities") return asString(doc.slug) || undefined;

  const directCitySlug = relationshipSlug(doc.city);
  if (directCitySlug) return directCitySlug;

  const cityId = relationshipId(doc.city);
  if (!cityId) return undefined;

  try {
    const city = (await req.payload.findByID({
      collection: "cities" as never,
      id: cityId,
      depth: 0,
      overrideAccess: true,
    })) as CMSDoc;

    return asString(city.slug) || undefined;
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: "Unable to resolve city slug during public cache revalidation.",
    });
    return undefined;
  }
};

const pathsForDoc = (collection: string, doc: CMSDoc, citySlug?: string) => {
  const slug = asString(doc.slug);
  const paths = new Set<string>(["/", "/en", "/ar"]);

  if (citySlug) {
    paths.add(`/city/${citySlug}`);
    paths.add(`/en/city/${citySlug}`);
    paths.add(`/ar/city/${citySlug}`);
  }

  if (!citySlug || !slug) return Array.from(paths);

  if (collection === "guide-items") {
    const routeKind = routeKindByGuideItemKind[asString(doc.kind)];
    if (routeKind) {
      for (const path of prefixedPaths(
        `/city/${citySlug}/${routeKind}/${slug}`,
      )) {
        paths.add(path);
      }
    }
    const sectionSlug = asString(doc.sectionSlug);
    if (sectionSlug) {
      for (const path of prefixedPaths(
        `/city/${citySlug}/section/${sectionSlug}`,
      )) {
        paths.add(path);
      }
    }
  }

  if (collection === "guide-sections") {
    const sectionSlug = asString(doc.sectionSlug) || slug;
    for (const path of prefixedPaths(`/city/${citySlug}/section/${sectionSlug}`)) {
      paths.add(path);
    }
  }

  if (collection === "neighborhoods") {
    for (const path of prefixedPaths(`/city/${citySlug}/neighborhood/${slug}`)) {
      paths.add(path);
    }
  }

  if (collection === "listings") {
    const routeKind = routeKindByListingType[asString(doc.listingType)];
    if (routeKind) {
      for (const path of prefixedPaths(
        `/city/${citySlug}/${routeKind}/${slug}`,
      )) {
        paths.add(path);
      }
    }
  }

  if (collection === "itineraries") {
    for (const path of prefixedPaths(`/city/${citySlug}/itineraries`)) {
      paths.add(path);
    }
  }

  return Array.from(paths);
};

export const revalidatePublicCityContent = async ({
  collection,
  doc,
  req,
}: {
  collection: string;
  doc: CMSDoc;
  req: PayloadRequest;
}) => {
  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");
    const citySlug =
      collection === "media"
        ? undefined
        : await resolveCitySlug(collection, doc, req);

    revalidateTag("irhal-city", { expire: 0 });
    revalidateTag("irhal-city-nav", { expire: 0 });

    for (const path of pathsForDoc(collection, doc, citySlug)) {
      revalidatePath(path);
    }
  } catch (error) {
    req.payload.logger.warn({
      collection,
      err: error,
      msg: "Public cache revalidation skipped.",
    });
  }
};

export const revalidateAfterChange: CollectionAfterChangeHook = async ({
  collection,
  context,
  doc,
  req,
}) => {
  if ((context as { skipPublicRevalidate?: boolean }).skipPublicRevalidate) {
    return;
  }

  await revalidatePublicCityContent({
    collection: collection.slug,
    doc: doc as CMSDoc,
    req,
  });
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = async ({
  collection,
  context,
  doc,
  req,
}) => {
  if ((context as { skipPublicRevalidate?: boolean }).skipPublicRevalidate) {
    return;
  }

  await revalidatePublicCityContent({
    collection: collection.slug,
    doc: doc as CMSDoc,
    req,
  });
};

export const revalidateSiteSettingsAfterChange: GlobalAfterChangeHook = async ({
  context,
  req,
}) => {
  if ((context as { skipPublicRevalidate?: boolean }).skipPublicRevalidate) {
    return;
  }

  try {
    const { revalidatePath, revalidateTag } = await import("next/cache");

    revalidateTag("irhal-site-settings", { expire: 0 });
    for (const path of ["/", "/en", "/ar", "/robots.txt", "/sitemap.xml"]) {
      revalidatePath(path);
    }
  } catch (error) {
    req.payload.logger.warn({
      err: error,
      msg: "Site settings cache revalidation skipped.",
    });
  }
};
