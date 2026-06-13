import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    alter table "payload"."itineraries"
      add column if not exists "intro" varchar,
      add column if not exists "planning_stay" varchar,
      add column if not exists "planning_transport" varchar,
      add column if not exists "planning_meals_breakfast" varchar,
      add column if not exists "planning_meals_lunch" varchar,
      add column if not exists "planning_meals_dinner" varchar;

    alter table "payload"."itineraries_days"
      add column if not exists "description" varchar,
      add column if not exists "start" varchar,
      add column if not exists "transport" varchar,
      add column if not exists "breakfast" varchar,
      add column if not exists "lunch" varchar,
      add column if not exists "dinner" varchar,
      add column if not exists "pacing" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    alter table "payload"."itineraries_days"
      drop column if exists "pacing",
      drop column if exists "dinner",
      drop column if exists "lunch",
      drop column if exists "breakfast",
      drop column if exists "transport",
      drop column if exists "start",
      drop column if exists "description";

    alter table "payload"."itineraries"
      drop column if exists "planning_meals_dinner",
      drop column if exists "planning_meals_lunch",
      drop column if exists "planning_meals_breakfast",
      drop column if exists "planning_transport",
      drop column if exists "planning_stay",
      drop column if exists "intro";
  `);
}
