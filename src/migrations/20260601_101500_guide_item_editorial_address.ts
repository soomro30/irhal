import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    alter table payload.guide_items
      add column if not exists address text,
      add column if not exists arabic_title varchar,
      add column if not exists arabic_summary text,
      add column if not exists arabic_overview text,
      add column if not exists arabic_area varchar,
      add column if not exists arabic_category varchar,
      add column if not exists arabic_address varchar;

    alter table payload._guide_items_v
      add column if not exists version_address text,
      add column if not exists version_arabic_title varchar,
      add column if not exists version_arabic_summary text,
      add column if not exists version_arabic_overview text,
      add column if not exists version_arabic_area varchar,
      add column if not exists version_arabic_category varchar,
      add column if not exists version_arabic_address varchar;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    alter table payload._guide_items_v
      drop column if exists version_arabic_address,
      drop column if exists version_arabic_category,
      drop column if exists version_arabic_area,
      drop column if exists version_arabic_overview,
      drop column if exists version_arabic_summary,
      drop column if exists version_arabic_title,
      drop column if exists version_address;

    alter table payload.guide_items
      drop column if exists arabic_address,
      drop column if exists arabic_category,
      drop column if exists arabic_area,
      drop column if exists arabic_overview,
      drop column if exists arabic_summary,
      drop column if exists arabic_title,
      drop column if exists address;
  `);
}
