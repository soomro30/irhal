import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    do $$
    begin
      create type payload.enum_media_license as enum (
        'owned',
        'licensed',
        'creative-commons',
        'public-domain',
        'partner-provided',
        'editorial-review-required'
      );
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      create type payload.enum_media_usage_status as enum (
        'draft',
        'approved',
        'needs-replacement',
        'archived'
      );
    exception
      when duplicate_object then null;
    end $$;

    alter table payload.media
      add column if not exists photographer varchar,
      add column if not exists license payload.enum_media_license default 'editorial-review-required' not null,
      add column if not exists usage_status payload.enum_media_usage_status default 'draft' not null,
      add column if not exists usage_notes varchar,
      add column if not exists sizes_thumbnail_url varchar,
      add column if not exists sizes_thumbnail_width numeric,
      add column if not exists sizes_thumbnail_height numeric,
      add column if not exists sizes_thumbnail_mime_type varchar,
      add column if not exists sizes_thumbnail_filesize numeric,
      add column if not exists sizes_thumbnail_filename varchar,
      add column if not exists sizes_card_url varchar,
      add column if not exists sizes_card_width numeric,
      add column if not exists sizes_card_height numeric,
      add column if not exists sizes_card_mime_type varchar,
      add column if not exists sizes_card_filesize numeric,
      add column if not exists sizes_card_filename varchar,
      add column if not exists sizes_hero_url varchar,
      add column if not exists sizes_hero_width numeric,
      add column if not exists sizes_hero_height numeric,
      add column if not exists sizes_hero_mime_type varchar,
      add column if not exists sizes_hero_filesize numeric,
      add column if not exists sizes_hero_filename varchar;

    alter table payload.neighborhoods
      add column if not exists image_id integer,
      add column if not exists image_alt varchar;

    alter table payload.listings
      add column if not exists image_id integer,
      add column if not exists image_alt varchar;

    alter table payload._listings_v
      add column if not exists version_image_id integer,
      add column if not exists version_image_alt varchar;

    create table if not exists payload.listings_gallery (
      _order integer not null,
      _parent_id integer not null,
      id varchar primary key not null,
      image_id integer,
      caption varchar
    );

    create table if not exists payload._listings_v_version_gallery (
      _order integer not null,
      _parent_id integer not null,
      id serial primary key not null,
      image_id integer,
      caption varchar,
      _uuid varchar
    );

    do $$
    begin
      alter table payload.neighborhoods
        add constraint neighborhoods_image_id_media_id_fk
        foreign key (image_id) references payload.media(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload.listings
        add constraint listings_image_id_media_id_fk
        foreign key (image_id) references payload.media(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload._listings_v
        add constraint _listings_v_version_image_id_media_id_fk
        foreign key (version_image_id) references payload.media(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload.listings_gallery
        add constraint listings_gallery_parent_id_fk
        foreign key (_parent_id) references payload.listings(id)
        on delete cascade on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload.listings_gallery
        add constraint listings_gallery_image_id_media_id_fk
        foreign key (image_id) references payload.media(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload._listings_v_version_gallery
        add constraint _listings_v_version_gallery_parent_id_fk
        foreign key (_parent_id) references payload._listings_v(id)
        on delete cascade on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload._listings_v_version_gallery
        add constraint _listings_v_version_gallery_image_id_media_id_fk
        foreign key (image_id) references payload.media(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    create index if not exists neighborhoods_image_idx on payload.neighborhoods using btree (image_id);
    create index if not exists listings_image_idx on payload.listings using btree (image_id);
    create index if not exists listings_gallery_order_idx on payload.listings_gallery using btree (_order);
    create index if not exists listings_gallery_parent_id_idx on payload.listings_gallery using btree (_parent_id);
    create index if not exists listings_gallery_image_idx on payload.listings_gallery using btree (image_id);
    create index if not exists _listings_v_version_gallery_order_idx on payload._listings_v_version_gallery using btree (_order);
    create index if not exists _listings_v_version_gallery_parent_id_idx on payload._listings_v_version_gallery using btree (_parent_id);
    create index if not exists _listings_v_version_gallery_image_idx on payload._listings_v_version_gallery using btree (image_id);
    create index if not exists _listings_v_version_version_image_idx on payload._listings_v using btree (version_image_id);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    drop table if exists payload._listings_v_version_gallery cascade;
    drop table if exists payload.listings_gallery cascade;

    alter table payload._listings_v
      drop column if exists version_image_alt,
      drop column if exists version_image_id;

    alter table payload.listings
      drop column if exists image_alt,
      drop column if exists image_id;

    alter table payload.neighborhoods
      drop column if exists image_alt,
      drop column if exists image_id;

    alter table payload.media
      drop column if exists sizes_hero_filename,
      drop column if exists sizes_hero_filesize,
      drop column if exists sizes_hero_mime_type,
      drop column if exists sizes_hero_height,
      drop column if exists sizes_hero_width,
      drop column if exists sizes_hero_url,
      drop column if exists sizes_card_filename,
      drop column if exists sizes_card_filesize,
      drop column if exists sizes_card_mime_type,
      drop column if exists sizes_card_height,
      drop column if exists sizes_card_width,
      drop column if exists sizes_card_url,
      drop column if exists sizes_thumbnail_filename,
      drop column if exists sizes_thumbnail_filesize,
      drop column if exists sizes_thumbnail_mime_type,
      drop column if exists sizes_thumbnail_height,
      drop column if exists sizes_thumbnail_width,
      drop column if exists sizes_thumbnail_url,
      drop column if exists usage_notes,
      drop column if exists usage_status,
      drop column if exists license,
      drop column if exists photographer;

    drop type if exists payload.enum_media_usage_status;
    drop type if exists payload.enum_media_license;
  `);
}
