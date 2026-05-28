import type { Field } from "payload";

export const workflowStatusField: Field = {
  name: "workflowStatus",
  type: "select",
  defaultValue: "draft",
  options: ["draft", "review", "approved", "published", "updated", "archived"],
  required: true,
};

export const seoFields: Field = {
  name: "seo",
  type: "group",
  fields: [
    { name: "title", type: "text", required: true },
    { name: "description", type: "textarea", required: true },
    { name: "canonicalUrl", type: "text" },
    { name: "openGraphImage", type: "upload", relationTo: "media" },
    {
      name: "robots",
      type: "select",
      defaultValue: "index,follow",
      options: ["index,follow", "noindex,follow", "noindex,nofollow"],
      required: true,
    },
    { name: "schemaType", type: "text", required: true },
  ],
};

export const sourceFields: Field = {
  name: "sources",
  type: "array",
  fields: [
    { name: "label", type: "text", required: true },
    { name: "url", type: "text", required: true },
    {
      name: "type",
      type: "select",
      options: ["official", "map-provider", "editorial", "partner", "user-submitted"],
      required: true,
    },
    { name: "verifiedAt", type: "date", required: true },
    {
      name: "confidence",
      type: "select",
      defaultValue: "medium",
      options: ["low", "medium", "high"],
      required: true,
    },
  ],
};

export const geoFields: Field[] = [
  {
    name: "latitude",
    type: "number",
    required: true,
  },
  {
    name: "longitude",
    type: "number",
    required: true,
  },
  {
    name: "geo",
    type: "point",
    required: true,
  },
  {
    name: "mapUrl",
    type: "text",
    required: true,
  },
];
