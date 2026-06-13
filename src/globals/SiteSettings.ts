import type { GlobalConfig } from "payload";

import { seoSettingsEditors } from "@/collections/access";
import { revalidateSiteSettingsAfterChange } from "@/collections/revalidate";

export const SiteSettings: GlobalConfig = {
  slug: "site-settings",
  access: {
    read: () => true,
    update: seoSettingsEditors,
  },
  admin: {
    group: "Settings",
  },
  hooks: {
    afterChange: [revalidateSiteSettingsAfterChange],
  },
  label: "Site Settings",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "General SEO",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "siteName",
                  type: "text",
                  defaultValue: "Irhal",
                  required: true,
                },
                {
                  name: "siteUrl",
                  type: "text",
                  admin: {
                    description:
                      "Canonical production origin, for example https://irhal-portal.vercel.app. Falls back to NEXT_PUBLIC_SITE_URL if empty.",
                  },
                },
              ],
            },
            {
              name: "defaultSeoTitle",
              type: "text",
              defaultValue: "Irhal AI Travel",
              required: true,
            },
            {
              name: "defaultSeoDescription",
              type: "textarea",
              defaultValue:
                "Muslim-friendly city guides with maps, halal-aware planning, local areas, and practical travel essentials.",
              required: true,
            },
            {
              name: "defaultOpenGraphImage",
              type: "upload",
              relationTo: "media",
            },
          ],
        },
        {
          label: "Search Verification",
          fields: [
            {
              name: "googleSiteVerification",
              type: "text",
              admin: {
                description:
                  "Only the content value from Google's meta tag, not the full tag.",
              },
            },
            {
              name: "bingSiteVerification",
              type: "text",
              admin: {
                description:
                  "Only the content value from Bing Webmaster Tools verification.",
              },
            },
            {
              name: "yandexVerification",
              type: "text",
            },
            {
              name: "pinterestVerification",
              type: "text",
            },
          ],
        },
        {
          label: "Analytics",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "analyticsEnabled",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "cookieConsentRequired",
                  type: "checkbox",
                  defaultValue: false,
                  admin: {
                    description:
                      "When enabled, future consent UI can use this flag before loading analytics.",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "ga4MeasurementId",
                  type: "text",
                  admin: {
                    description: "Public GA4 measurement ID, for example G-XXXXXXXXXX.",
                  },
                },
                {
                  name: "googleTagManagerId",
                  type: "text",
                  admin: {
                    description: "Public GTM container ID, for example GTM-XXXXXXX.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Content Display",
          fields: [
            {
              name: "guideCardSortMode",
              type: "select",
              defaultValue: "media",
              options: [
                {
                  label: "Media first",
                  value: "media",
                },
                {
                  label: "More description first",
                  value: "more-description",
                },
                {
                  label: "Recent update first",
                  value: "recent-update",
                },
                {
                  label: "Name A-Z",
                  value: "name",
                },
              ],
              required: true,
              admin: {
                description:
                  "Default ordering for public guide cards and rails. Media first gives photo-backed records priority for a more polished public page.",
              },
            },
          ],
        },
        {
          label: "Organization Schema",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "organizationName",
                  type: "text",
                  defaultValue: "Irhal",
                },
                {
                  name: "organizationUrl",
                  type: "text",
                },
              ],
            },
            {
              name: "organizationLogo",
              type: "upload",
              relationTo: "media",
            },
            {
              name: "sameAs",
              type: "array",
              admin: {
                description:
                  "Official social/profile URLs used in Organization JSON-LD.",
              },
              fields: [
                {
                  name: "url",
                  type: "text",
                  required: true,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
