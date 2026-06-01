import type { CollectionConfig } from "payload";

import { editorsOnly, workflowPublishedOrEditor } from "./access";
import {
  seoFields,
  sourceFields,
  translationFields,
  workflowStatusField,
} from "./shared";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const GuideSections: CollectionConfig = {
  slug: "guide-sections",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: workflowPublishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["title", "city", "sectionSlug", "workflowStatus"],
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
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
