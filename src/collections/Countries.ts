import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import { seoFields, sourceFields, workflowStatusField } from "./shared";

export const Countries: CollectionConfig = {
  slug: "countries",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["name", "iso2", "region", "workflowStatus", "updatedAt"],
    group: "Geography",
    useAsTitle: "name",
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: "name", type: "text", required: true, unique: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "iso2", type: "text", required: true, unique: true, maxLength: 2 },
    { name: "iso3", type: "text", required: true, unique: true, maxLength: 3 },
    { name: "region", type: "text", required: true },
    { name: "subregion", type: "text" },
    { name: "capital", type: "text" },
    { name: "currency", type: "text", required: true },
    { name: "timezoneNotes", type: "textarea" },
    {
      name: "languages",
      type: "array",
      fields: [{ name: "language", type: "text", required: true }],
    },
    {
      name: "callingCodes",
      type: "array",
      fields: [{ name: "code", type: "text", required: true }],
    },
    { name: "summary", type: "textarea", required: true },
    { name: "flagEmoji", type: "text", maxLength: 8 },
    workflowStatusField,
    seoFields,
    sourceFields,
    { name: "lastVerifiedAt", type: "date", required: true },
  ],
};
