import { postgresAdapter } from "@payloadcms/db-postgres";
import { searchPlugin } from "@payloadcms/plugin-search";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
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
const databaseUrl = process.env.DATABASE_URL?.includes("<") ? "" : process.env.DATABASE_URL || "";

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
    },
  }),
  editor: lexicalEditor(),
  localization: {
    defaultLocale: "en",
    fallback: true,
    locales: ["en", "ar", "ur"],
  },
  plugins: [
    searchPlugin({
      collections: ["countries", "cities", "guide-sections", "guide-items", "neighborhoods", "listings", "itineraries"],
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
