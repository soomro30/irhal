import type { CollectionConfig } from "payload";

import { editorsOnly, publishedOrEditor } from "./access";
import {
  seoFields,
  sourceFields,
  workflowStatusField,
} from "./shared";
import { revalidateAfterChange, revalidateAfterDelete } from "./revalidate";

export const GuideItems: CollectionConfig = {
  slug: "guide-items",
  access: {
    create: editorsOnly,
    delete: editorsOnly,
    read: publishedOrEditor,
    update: editorsOnly,
  },
  admin: {
    defaultColumns: [
      "title",
      "kind",
      "city",
      "neighborhood",
      "sectionSlug",
      "geoStatus",
      "workflowStatus",
    ],
    useAsTitle: "title",
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Edit Content",
          fields: [
            {
              type: "row",
              fields: [
                { name: "title", type: "text", required: true },
                { name: "slug", type: "text", required: true },
              ],
            },
            { name: "summary", type: "textarea", required: true },
            { name: "body", type: "richText" },
            {
              type: "collapsible",
              label: "Arabic content",
              admin: {
                description:
                  "Normal editor fields for the Arabic public page. Use Arabic script here; no JSON editing needed.",
                initCollapsed: false,
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "arabicTitle", type: "text", label: "Arabic title" },
                    { name: "arabicSummary", type: "textarea", label: "Arabic summary" },
                  ],
                },
                {
                  name: "arabicOverview",
                  type: "textarea",
                  label: "Arabic overview",
                  admin: {
                    description:
                      "Use blank lines between paragraphs. This feeds the Overview section on Arabic pages.",
                  },
                },
                {
                  type: "row",
                  fields: [
                    { name: "arabicArea", type: "text", label: "Arabic area" },
                    { name: "arabicCategory", type: "text", label: "Arabic category/type" },
                  ],
                },
                { name: "arabicAddress", type: "text", label: "Arabic address" },
              ],
            },
            {
              type: "collapsible",
              label: "Routing and classification",
              admin: {
                description:
                  "Usually set during import. Edit only when the URL, city, section, or item type must change.",
                initCollapsed: true,
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "kind",
                      type: "select",
                      options: [
                        "place",
                        "hotel",
                        "restaurant",
                        "masjid",
                        "shopping",
                        "tour",
                        "family",
                        "festival",
                      ],
                      required: true,
                    },
                    {
                      name: "city",
                      type: "relationship",
                      relationTo: "cities",
                      required: true,
                    },
                  ],
                },
                { name: "section", type: "relationship", relationTo: "guide-sections" },
                { name: "sectionSlug", type: "text", required: true },
              ],
            },
          ],
        },
        {
          label: "Media",
          fields: [
            {
              name: "mediaDiscovery",
              type: "ui",
              admin: {
                components: {
                  Field:
                    "/components/admin/GuideItemMediaDiscovery#GuideItemMediaDiscovery",
                },
              },
            },
            { name: "image", type: "upload", relationTo: "media" },
            {
              name: "gallery",
              type: "array",
              labels: { plural: "Gallery images", singular: "Gallery image" },
              fields: [
                { name: "image", type: "upload", relationTo: "media", required: true },
              ],
            },
            { name: "imageAlt", type: "text", required: true },
          ],
        },
        {
          label: "Place Details",
          fields: [
            {
              type: "row",
              fields: [
                { name: "area", type: "text" },
                { name: "category", type: "text" },
              ],
            },
            { name: "address", type: "text" },
            { name: "neighborhood", type: "relationship", relationTo: "neighborhoods" },
            {
              type: "row",
              fields: [
                { name: "budget", type: "text" },
                { name: "mapUrl", type: "text" },
              ],
            },
            {
              type: "collapsible",
              label: "Geo enrichment",
              admin: {
                description:
                  "Operational fields for map validation and provider enrichment.",
                initCollapsed: true,
              },
              fields: [
                {
                  name: "geoStatus",
                  type: "select",
                  defaultValue: "provider-enrichment-required",
                  options: [
                    "provider-enrichment-required",
                    "coordinates-required",
                    "verified",
                  ],
                  required: true,
                },
                {
                  type: "row",
                  fields: [
                    { name: "latitude", type: "number" },
                    { name: "longitude", type: "number" },
                  ],
                },
                { name: "providerPlaceId", type: "text" },
              ],
            },
          ],
        },
        {
          label: "SEO",
          fields: [seoFields],
        },
        {
          label: "Workflow & Sources",
          fields: [
            workflowStatusField,
            sourceFields,
            {
              type: "collapsible",
              label: "Import metadata",
              admin: {
                description:
                  "System fields retained for traceability. Editors normally do not need to change these.",
                initCollapsed: true,
              },
              fields: [
                { name: "sourceTable", type: "text" },
                { name: "sourceRowId", type: "text" },
                { name: "importedDetails", type: "json" },
                {
                  name: "translations",
                  type: "json",
                  admin: {
                    description:
                      "Legacy translation JSON retained for imports and backwards compatibility. Use the Arabic content fields for normal editing.",
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
