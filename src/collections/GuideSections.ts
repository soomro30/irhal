import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import {
  seoFields,
  sourceFields,
  translationFields,
  workflowStatusField,
} from "./shared";

export const GuideSections: CollectionConfig = {
  slug: "guide-sections",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["title", "city", "sectionSlug", "workflowStatus"],
    useAsTitle: "title",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "sectionSlug", type: "text", required: true },
    { name: "city", type: "relationship", relationTo: "cities", required: true },
    {
      name: "sectionType",
      type: "select",
      defaultValue: "editorial",
      options: ["editorial", "directory", "mixed", "locator"],
      required: true,
    },
    { name: "summary", type: "textarea", required: true },
    { name: "body", type: "richText" },
    { name: "sourceImport", type: "json" },
    translationFields,
    workflowStatusField,
    seoFields,
    sourceFields,
  ],
};
