import nextEnv from "@next/env";
import { createRequire } from "node:module";

import { londonItineraryDetailsBySlug } from "./lib/london-itinerary-details";

nextEnv.loadEnvConfig(process.cwd());

const require = createRequire(import.meta.url);
const { Client } = require("pg") as {
  Client: new (config: {
    connectionString: string;
    ssl?: { rejectUnauthorized: boolean };
  }) => DbClient;
};

type QueryResult = {
  rowCount: number;
  rows: Array<Record<string, unknown>>;
};

type DbClient = {
  connect: () => Promise<void>;
  end: () => Promise<void>;
  query: (sql: string, values?: unknown[]) => Promise<QueryResult>;
};

const databaseUrl = process.env.DATABASE_URL?.includes("<")
  ? ""
  : process.env.DATABASE_URL;

if (!databaseUrl || !process.env.PAYLOAD_SECRET) {
  throw new Error(
    "A real DATABASE_URL and PAYLOAD_SECRET are required to update Payload CMS documents.",
  );
}

const ensureSchema = async (client: DbClient) => {
  await client.query(`
    alter table payload.itineraries
      add column if not exists intro varchar,
      add column if not exists planning_stay varchar,
      add column if not exists planning_transport varchar,
      add column if not exists planning_meals_breakfast varchar,
      add column if not exists planning_meals_lunch varchar,
      add column if not exists planning_meals_dinner varchar;

    alter table payload.itineraries_days
      add column if not exists description varchar,
      add column if not exists start varchar,
      add column if not exists transport varchar,
      add column if not exists breakfast varchar,
      add column if not exists lunch varchar,
      add column if not exists dinner varchar,
      add column if not exists pacing varchar;
  `);
};

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

try {
  await client.query("begin");
  await ensureSchema(client);

  const cityResult = await client.query(
    "select id from payload.cities where slug = $1 limit 1",
    ["london"],
  );
  const cityId = cityResult.rows[0]?.id;
  if (!cityId) throw new Error("London city was not found in Payload.");

  const itineraryResult = await client.query(
    `select id, slug
     from payload.itineraries
     where city_id = $1
       and slug = any($2::text[])`,
    [cityId, Object.keys(londonItineraryDetailsBySlug)],
  );
  const idBySlug = new Map(
    itineraryResult.rows.map((row) => [String(row.slug), row.id]),
  );
  const missing = Object.keys(londonItineraryDetailsBySlug).filter(
    (slug) => !idBySlug.has(slug),
  );
  if (missing.length > 0) {
    throw new Error(`Missing London itineraries in Payload: ${missing.join(", ")}`);
  }

  let updatedDays = 0;
  for (const [slug, detail] of Object.entries(londonItineraryDetailsBySlug)) {
    const itineraryId = idBySlug.get(slug);
    await client.query(
      `update payload.itineraries
       set intro = $2,
           planning_stay = $3,
           planning_transport = $4,
           planning_meals_breakfast = $5,
           planning_meals_lunch = $6,
           planning_meals_dinner = $7,
           updated_at = now()
       where id = $1`,
      [
        itineraryId,
        detail.intro,
        detail.planning.stay ?? null,
        detail.planning.transport ?? null,
        detail.planning.meals?.breakfast ?? null,
        detail.planning.meals?.lunch ?? null,
        detail.planning.meals?.dinner ?? null,
      ],
    );

    for (const day of detail.days) {
      const dayResult = await client.query(
        `update payload.itineraries_days
         set description = $3,
             start = $4,
             transport = $5,
             breakfast = $6,
             lunch = $7,
             dinner = $8,
             pacing = $9,
             route_notes = $10
         where _parent_id = $1
           and day_number = $2`,
        [
          itineraryId,
          day.dayNumber,
          day.description ?? null,
          day.start ?? null,
          day.transport ?? null,
          day.breakfast ?? null,
          day.lunch ?? null,
          day.dinner ?? null,
          day.pacing ?? null,
          day.routeNotes,
        ],
      );
      if (dayResult.rowCount !== 1) {
        throw new Error(
          `Expected one day row for ${slug} day ${day.dayNumber}, updated ${dayResult.rowCount}.`,
        );
      }
      updatedDays += dayResult.rowCount;
    }
  }

  await client.query("commit");
  console.log(
    `Updated ${idBySlug.size} London itineraries and ${updatedDays} itinerary day rows in Payload.`,
  );
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
