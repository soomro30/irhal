import type { CollectionConfig } from "payload";

import { approvedMediaOrEditor, editorsOnly } from "./access";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

const asString = (value: unknown) => (typeof value === "string" ? value : "");

const adminThumbnail = ({ doc }: { doc: Record<string, unknown> }) => {
  const thumbnail = asRecord(asRecord(doc.sizes).thumbnail);
  return asString(thumbnail.url) || asString(doc.url) || null;
};

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: approvedMediaOrEditor,
    update: editorsOnly,
  },
  admin: {
    useAsTitle: "alt",
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  upload: {
    adminThumbnail,
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
