import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import { geoFields, seoFields, sourceFields, workflowStatusField } from "./shared";

export const Neighborhoods: CollectionConfig = {
  slug: "neighborhoods",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["name", "city", "district", "clusterType", "workflowStatus"],
    useAsTitle: "name",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "city", type: "relationship", relationTo: "cities", required: true },
    { name: "district", type: "relationship", relationTo: "districts", required: true },
    {
      name: "clusterType",
      type: "select",
      options: ["historic", "business", "shopping", "food", "family", "waterfront", "airport", "religious", "mixed"],
      required: true,
    },
    { name: "operatingGuide", type: "textarea", required: true },
    { name: "bestFor", type: "array", fields: [{ name: "value", type: "text", required: true }] },
    ...geoFields,
    { name: "liveMapQueries", type: "json", required: true },
    workflowStatusField,
    seoFields,
    sourceFields,
  ],
};
