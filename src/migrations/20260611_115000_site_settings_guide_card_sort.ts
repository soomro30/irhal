import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    do $$
    begin
      create type "payload"."enum_site_settings_guide_card_sort_mode" as enum (
        'media',
        'more-description',
        'recent-update',
        'name'
      );
    exception
      when duplicate_object then null;
    end $$;

    alter table "payload"."site_settings"
      add column if not exists "guide_card_sort_mode"
      "payload"."enum_site_settings_guide_card_sort_mode" default 'media' not null;

    update "payload"."site_settings"
      set "guide_card_sort_mode" = 'media'
      where "guide_card_sort_mode" is null;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    alter table "payload"."site_settings"
      drop column if exists "guide_card_sort_mode";

    drop type if exists "payload"."enum_site_settings_guide_card_sort_mode";
  `);
}
