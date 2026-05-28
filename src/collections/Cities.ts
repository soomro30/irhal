import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import { geoFields, seoFields, sourceFields, workflowStatusField } from "./shared";

export const Cities: CollectionConfig = {
  slug: "cities",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["name", "country", "workflowStatus", "updatedAt"],
    useAsTitle: "name",
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "country", type: "text", required: true },
    { name: "region", type: "text" },
    { name: "locale", type: "text", defaultValue: "en", required: true },
    { name: "lede", type: "textarea", required: true, maxLength: 650 },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "timezone", type: "text", required: true },
    { name: "languages", type: "array", fields: [{ name: "language", type: "text", required: true }] },
    { name: "currency", type: "text", required: true },
    ...geoFields,
    {
      name: "fastFacts",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
    {
      name: "structuredSections",
      type: "json",
      admin: {
        description: "Mandatory 15-section Karachi-model city guide payload.",
      },
      required: true,
    },
    workflowStatusField,
    seoFields,
    sourceFields,
    { name: "lastVerifiedAt", type: "date", required: true },
  ],
};
