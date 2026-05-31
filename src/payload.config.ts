import { postgresAdapter } from "@payloadcms/db-postgres";
import { searchPlugin } from "@payloadcms/plugin-search";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";

import { AIJobs } from "./collections/AIJobs";
import { Cities } from "./collections/Cities";
import { Countries } from "./collections/Countries";
import { Districts } from "./collections/Districts";
import { GuideItems } from "./collections/GuideItems";
import { GuideSections } from "./collections/GuideSections";
import { Itineraries } from "./collections/Itineraries";
import { Listings } from "./collections/Listings";
import { Media } from "./collections/Media";
import { Neighborhoods } from "./collections/Neighborhoods";
import { UpdateLogs } from "./collections/UpdateLogs";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const databaseUrl = process.env.DATABASE_URL?.includes("<")
  ? ""
  : process.env.DATABASE_URL || "";
const r2Endpoint =
  process.env.CLOUDFLARE_R2_ENDPOINT ||
  (process.env.CLOUDFLARE_ACCOUNT_ID
    ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : "");
const r2PublicUrl =
  process.env.CLOUDFLARE_R2_PUBLIC_URL?.replace(/\/$/, "") || "";
const r2StorageEnabled = Boolean(
  process.env.CLOUDFLARE_R2_BUCKET &&
  process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
  process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY &&
  r2Endpoint &&
  r2PublicUrl,
);

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Countries,
    Cities,
    GuideSections,
    GuideItems,
    Districts,
    Neighborhoods,
    Listings,
    Itineraries,
    AIJobs,
    UpdateLogs,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: databaseUrl,
      ssl: databaseUrl
        ? {
            rejectUnauthorized: false,
          }
        : undefined,
    },
    schemaName: "payload",
  }),
  editor: lexicalEditor(),
  localization: {
    defaultLocale: "en",
    fallback: true,
    locales: ["en", "ar", "ur"],
  },
  plugins: [
    s3Storage({
      enabled: r2StorageEnabled,
      collections: {
        media: {
          disablePayloadAccessControl: true,
          prefix: "media",
          generateFileURL: ({ filename, prefix }) => {
            const key = prefix ? `${prefix}/${filename}` : filename;
            return `${r2PublicUrl}/${key}`;
          },
        },
      },
      bucket: process.env.CLOUDFLARE_R2_BUCKET || "",
      config: {
        credentials: {
          accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
        },
        endpoint: r2Endpoint,
        forcePathStyle: true,
        region: "auto",
      },
    }),
    searchPlugin({
      collections: [
        "countries",
        "cities",
        "guide-sections",
        "guide-items",
        "neighborhoods",
        "listings",
        "itineraries",
      ],
      defaultPriorities: {
        countries: 95,
        cities: 90,
        "guide-sections": 85,
        "guide-items": 80,
        neighborhoods: 75,
        listings: 70,
        itineraries: 65,
      },
    }),
  ],
  routes: {
    admin: "/admin",
    api: "/payload-api",
  },
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
