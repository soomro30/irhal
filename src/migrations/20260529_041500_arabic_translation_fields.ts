import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    alter table payload.cities
      add column if not exists translations jsonb;

    alter table payload._cities_v
      add column if not exists version_translations jsonb;

    alter table payload.guide_sections
      add column if not exists translations jsonb;

    alter table payload.guide_items
      add column if not exists translations jsonb;

    alter table payload._guide_items_v
      add column if not exists version_translations jsonb;

    alter table payload.neighborhoods
      add column if not exists translations jsonb;

    alter table payload.listings
      add column if not exists translations jsonb;

    alter table payload._listings_v
      add column if not exists version_translations jsonb;

    alter table payload.itineraries
      add column if not exists translations jsonb;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    alter table payload.itineraries
      drop column if exists translations;

    alter table payload._listings_v
      drop column if exists version_translations;

    alter table payload.listings
      drop column if exists translations;

    alter table payload.neighborhoods
      drop column if exists translations;

    alter table payload._guide_items_v
      drop column if exists version_translations;

    alter table payload.guide_items
      drop column if exists translations;

    alter table payload.guide_sections
      drop column if exists translations;

    alter table payload._cities_v
      drop column if exists version_translations;

    alter table payload.cities
      drop column if exists translations;
  `);
}
