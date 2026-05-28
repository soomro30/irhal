import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    useAsTitle: "alt",
  },
  upload: {
    mimeTypes: ["image/*", "application/pdf"],
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "caption",
      type: "textarea",
    },
    {
      name: "attribution",
      type: "text",
    },
    {
      name: "sourceUrl",
      type: "text",
    },
  ],
};
