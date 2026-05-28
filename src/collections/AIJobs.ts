import type { CollectionConfig } from "payload";

import { editorsOnly } from "./access";

export const AIJobs: CollectionConfig = {
  slug: "ai-jobs",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: editorsOnly,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["agent", "taskType", "status", "updatedAt"],
    useAsTitle: "taskType",
  },
  fields: [
    {
      name: "agent",
      type: "select",
      options: ["city-content", "seo", "data-validation", "map-enrichment", "itinerary", "muslim-travel", "content-update"],
      required: true,
    },
    { name: "taskType", type: "text", required: true },
    { name: "input", type: "json", required: true },
    { name: "output", type: "json" },
    {
      name: "status",
      type: "select",
      defaultValue: "queued",
      options: ["queued", "running", "completed", "failed", "blocked"],
      required: true,
    },
    { name: "validationReport", type: "json" },
  ],
};
