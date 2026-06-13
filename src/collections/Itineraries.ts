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
    {
      name: "intro",
      type: "textarea",
      admin: {
        description:
          "Longer route introduction shown on the itinerary detail hero.",
      },
    },
    {
      name: "planning",
      type: "group",
      fields: [
        { name: "stay", type: "textarea" },
        { name: "transport", type: "textarea" },
        {
          name: "meals",
          type: "group",
          fields: [
            { name: "breakfast", type: "textarea" },
            { name: "lunch", type: "textarea" },
            { name: "dinner", type: "textarea" },
          ],
        },
      ],
    },
    translationFields,
    {
      name: "days",
      type: "array",
      required: true,
      fields: [
        { name: "dayNumber", type: "number", required: true },
        { name: "theme", type: "text", required: true },
        { name: "description", type: "textarea" },
        { name: "start", type: "textarea" },
        { name: "transport", type: "textarea" },
        { name: "breakfast", type: "textarea" },
        { name: "lunch", type: "textarea" },
        { name: "dinner", type: "textarea" },
        { name: "pacing", type: "textarea" },
        { name: "stops", type: "relationship", relationTo: "listings", hasMany: true },
        {
          name: "stopSlugs",
          type: "textarea",
          admin: {
            description:
              "Optional newline-separated guide-item/listing stop slugs, with kind prefixes when useful, e.g. place:westminster-abbey.",
          },
        },
        { name: "routeNotes", type: "textarea" },
      ],
    },
    workflowStatusField,
    seoFields,
    sourceFields,
  ],
};
