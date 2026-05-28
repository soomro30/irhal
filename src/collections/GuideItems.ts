import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import { seoFields, sourceFields, workflowStatusField } from "./shared";

export const GuideItems: CollectionConfig = {
  slug: "guide-items",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["title", "kind", "city", "sectionSlug", "geoStatus", "workflowStatus"],
    useAsTitle: "title",
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    {
      name: "kind",
      type: "select",
      options: ["place", "hotel", "restaurant", "masjid", "shopping", "tour", "family", "festival"],
      required: true,
    },
    { name: "city", type: "relationship", relationTo: "cities", required: true },
    { name: "section", type: "relationship", relationTo: "guide-sections" },
    { name: "sectionSlug", type: "text", required: true },
    { name: "summary", type: "textarea", required: true },
    { name: "body", type: "richText" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "imageAlt", type: "text", required: true },
    { name: "area", type: "text" },
    { name: "category", type: "text" },
    { name: "budget", type: "text" },
    { name: "mapUrl", type: "text" },
    {
      name: "geoStatus",
      type: "select",
      defaultValue: "provider-enrichment-required",
      options: ["provider-enrichment-required", "coordinates-required", "verified"],
      required: true,
    },
    { name: "latitude", type: "number" },
    { name: "longitude", type: "number" },
    { name: "providerPlaceId", type: "text" },
    { name: "importedDetails", type: "json" },
    { name: "sourceTable", type: "text" },
    { name: "sourceRowId", type: "text" },
    workflowStatusField,
    seoFields,
    sourceFields,
  ],
};
