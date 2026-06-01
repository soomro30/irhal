import type { CollectionConfig } from "payload";

import { editorsOnly, workflowPublishedOrEditor } from "./access";
import {
  seoFields,
  sourceFields,
  translationFields,
  workflowStatusField,
} from "./shared";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const Itineraries: CollectionConfig = {
  slug: "itineraries",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: workflowPublishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["title", "city", "durationDays", "audience", "workflowStatus"],
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    { name: "city", type: "relationship", relationTo: "cities", required: true },
    { name: "durationDays", type: "number", required: true },
    {
      name: "audience",
      type: "select",
      options: ["first-time", "family", "muslim-traveler", "business", "budget", "luxury"],
      required: true,
    },
    { name: "summary", type: "textarea", required: true },
    translationFields,
    {
      name: "days",
      type: "array",
      required: true,
      fields: [
        { name: "dayNumber", type: "number", required: true },
        { name: "theme", type: "text", required: true },
        { name: "stops", type: "relationship", relationTo: "listings", hasMany: true },
        { name: "routeNotes", type: "textarea" },
      ],
    },
    workflowStatusField,
    seoFields,
    sourceFields,
  ],
};
