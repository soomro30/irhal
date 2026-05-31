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
    adminThumbnail: "thumbnail",
    formatOptions: {
      format: "webp",
      options: {
        effort: 6,
        quality: 58,
      },
    },
    imageSizes: [
      {
        name: "thumbnail",
        width: 320,
        height: 220,
        fit: "cover",
        formatOptions: {
          format: "webp",
          options: {
            effort: 6,
            quality: 48,
          },
        },
        position: "center",
        withoutEnlargement: true,
      },
      {
        name: "card",
        width: 640,
        height: 432,
        fit: "cover",
        formatOptions: {
          format: "webp",
          options: {
            effort: 6,
            quality: 54,
          },
        },
        position: "center",
        withoutEnlargement: true,
      },
      {
        name: "hero",
        width: 1440,
        height: 810,
        fit: "cover",
        formatOptions: {
          format: "webp",
          options: {
            effort: 6,
            quality: 58,
          },
        },
        position: "center",
        withoutEnlargement: true,
      },
    ],
    mimeTypes: ["image/*", "application/pdf"],
    resizeOptions: {
      fit: "inside",
      height: 1200,
      position: "center",
      width: 1800,
      withoutEnlargement: true,
    },
    withMetadata: false,
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
      name: "photographer",
      type: "text",
    },
    {
      name: "sourceUrl",
      type: "text",
    },
    {
      name: "license",
      type: "select",
      defaultValue: "editorial-review-required",
      options: [
        "owned",
        "licensed",
        "creative-commons",
        "public-domain",
        "partner-provided",
        "editorial-review-required",
      ],
      required: true,
    },
    {
      name: "usageStatus",
      type: "select",
      defaultValue: "draft",
      options: ["draft", "approved", "needs-replacement", "archived"],
      required: true,
    },
    {
      name: "usageNotes",
      type: "textarea",
    },
  ],
};
