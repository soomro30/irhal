import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    create table if not exists "payload"."site_settings" (
      "id" serial primary key not null,
      "site_name" varchar default 'Irhal' not null,
      "site_url" varchar,
      "default_seo_title" varchar default 'Irhal AI Travel' not null,
      "default_seo_description" varchar default 'Muslim-friendly city guides with maps, halal-aware planning, local areas, and practical travel essentials.' not null,
      "default_open_graph_image_id" integer,
      "google_site_verification" varchar,
      "bing_site_verification" varchar,
      "yandex_verification" varchar,
      "pinterest_verification" varchar,
      "analytics_enabled" boolean default false,
      "cookie_consent_required" boolean default false,
      "ga4_measurement_id" varchar,
      "google_tag_manager_id" varchar,
      "organization_name" varchar default 'Irhal',
      "organization_url" varchar,
      "organization_logo_id" integer,
      "updated_at" timestamp(3) with time zone,
      "created_at" timestamp(3) with time zone
    );

    create table if not exists "payload"."site_settings_same_as" (
      "_order" integer not null,
      "_parent_id" integer not null,
      "id" varchar primary key not null,
      "url" varchar not null
    );

    do $$
    begin
      if not exists (
        select 1 from pg_constraint
        where conname = 'site_settings_same_as_parent_id_fk'
      ) then
        alter table "payload"."site_settings_same_as"
          add constraint "site_settings_same_as_parent_id_fk"
          foreign key ("_parent_id")
          references "payload"."site_settings"("id")
          on delete cascade
          on update no action;
      end if;

      if not exists (
        select 1 from pg_constraint
        where conname = 'site_settings_default_open_graph_image_id_media_id_fk'
      ) then
        alter table "payload"."site_settings"
          add constraint "site_settings_default_open_graph_image_id_media_id_fk"
          foreign key ("default_open_graph_image_id")
          references "payload"."media"("id")
          on delete set null
          on update no action;
      end if;

      if not exists (
        select 1 from pg_constraint
        where conname = 'site_settings_organization_logo_id_media_id_fk'
      ) then
        alter table "payload"."site_settings"
          add constraint "site_settings_organization_logo_id_media_id_fk"
          foreign key ("organization_logo_id")
          references "payload"."media"("id")
          on delete set null
          on update no action;
      end if;
    end $$;

    create index if not exists "site_settings_same_as_order_idx"
      on "payload"."site_settings_same_as" using btree ("_order");

    create index if not exists "site_settings_same_as_parent_id_idx"
      on "payload"."site_settings_same_as" using btree ("_parent_id");

    create index if not exists "site_settings_default_open_graph_image_idx"
      on "payload"."site_settings" using btree ("default_open_graph_image_id");

    create index if not exists "site_settings_organization_logo_idx"
      on "payload"."site_settings" using btree ("organization_logo_id");

    insert into "payload"."site_settings" (
      "id",
      "site_name",
      "default_seo_title",
      "default_seo_description",
      "analytics_enabled",
      "cookie_consent_required",
      "organization_name",
      "updated_at",
      "created_at"
    )
    values (
      1,
      'Irhal',
      'Irhal AI Travel',
      'Muslim-friendly city guides with maps, halal-aware planning, local areas, and practical travel essentials.',
      false,
      false,
      'Irhal',
      now(),
      now()
    )
    on conflict ("id") do nothing;

    select setval(
      pg_get_serial_sequence('"payload"."site_settings"', 'id'),
      greatest((select max("id") from "payload"."site_settings"), 1),
      true
    );
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    drop table if exists "payload"."site_settings_same_as" cascade;
    drop table if exists "payload"."site_settings" cascade;
  `);
}
