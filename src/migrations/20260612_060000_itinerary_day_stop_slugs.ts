import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    alter table "payload"."itineraries_days"
      add column if not exists "stop_slugs" varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    alter table "payload"."itineraries_days"
      drop column if exists "stop_slugs";
  `);
}
