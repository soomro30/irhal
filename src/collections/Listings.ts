import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import {
  geoFields,
  seoFields,
  sourceFields,
  translationFields,
  workflowStatusField,
} from "./shared";

export const Listings: CollectionConfig = {
  slug: "listings",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: [
      "name",
      "listingType",
      "city",
      "neighborhood",
      "workflowStatus",
    ],
    useAsTitle: "name",
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true },
    {
      name: "listingType",
      type: "select",
      options: [
        "place",
        "hotel",
        "restaurant",
        "masjid",
        "shopping",
        "tour",
        "islamic-landmark",
        "prayer-area",
      ],
      required: true,
    },
    {
      name: "city",
      type: "relationship",
      relationTo: "cities",
      required: true,
    },
    {
      name: "neighborhood",
      type: "relationship",
      relationTo: "neighborhoods",
      required: true,
    },
    { name: "shortDescription", type: "textarea", required: true },
    { name: "editorialBody", type: "richText" },
    { name: "image", type: "upload", relationTo: "media" },
    { name: "imageAlt", type: "text" },
    {
      name: "gallery",
      type: "array",
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "caption", type: "text" },
      ],
    },
    { name: "address", type: "text", required: true },
    translationFields,
    ...geoFields,
    { name: "phone", type: "text" },
    { name: "website", type: "text" },
    { name: "openingHours", type: "json" },
    { name: "priceRange", type: "text" },
    { name: "affiliateUrl", type: "text" },
    {
      name: "muslimTravel",
      type: "group",
      fields: [
        { name: "isHalal", type: "checkbox", defaultValue: false },
        { name: "halalCertification", type: "text" },
        { name: "womenPrayerArea", type: "checkbox", defaultValue: false },
        { name: "familyFriendly", type: "checkbox", defaultValue: false },
        { name: "notes", type: "textarea" },
      ],
    },
    workflowStatusField,
    seoFields,
    sourceFields,
    { name: "lastVerifiedAt", type: "date", required: true },
  ],
};
