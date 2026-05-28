import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";

export const UpdateLogs: CollectionConfig = {
  slug: "update-logs",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: ["entityType", "entitySlug", "changeType", "verifiedAt"],
    useAsTitle: "entitySlug",
  },
  fields: [
    { name: "entityType", type: "text", required: true },
    { name: "entitySlug", type: "text", required: true },
    {
      name: "changeType",
      type: "select",
      options: ["created", "verified", "geo-updated", "seo-updated", "source-updated", "archived"],
      required: true,
    },
    { name: "summary", type: "textarea", required: true },
    { name: "sourceSnapshot", type: "json", required: true },
    { name: "verifiedAt", type: "date", required: true },
    { name: "verifiedBy", type: "relationship", relationTo: "users" },
  ],
};
