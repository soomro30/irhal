import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    create extension if not exists pg_trgm with schema extensions;

    create index if not exists cities_public_name_trgm_idx
      on payload.cities using gin (name extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists cities_public_slug_trgm_idx
      on payload.cities using gin (slug extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists countries_name_trgm_idx
      on payload.countries using gin (name extensions.gin_trgm_ops);

    create index if not exists guide_items_public_title_trgm_idx
      on payload.guide_items using gin (title extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_slug_trgm_idx
      on payload.guide_items using gin (slug extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_summary_trgm_idx
      on payload.guide_items using gin (summary extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_area_trgm_idx
      on payload.guide_items using gin (area extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_category_trgm_idx
      on payload.guide_items using gin (category extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_arabic_title_trgm_idx
      on payload.guide_items using gin (arabic_title extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists guide_items_public_arabic_summary_trgm_idx
      on payload.guide_items using gin (arabic_summary extensions.gin_trgm_ops)
      where _status = 'published';

    create index if not exists neighborhoods_published_name_trgm_idx
      on payload.neighborhoods using gin (name extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists neighborhoods_published_slug_trgm_idx
      on payload.neighborhoods using gin (slug extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists neighborhoods_published_operating_guide_trgm_idx
      on payload.neighborhoods using gin (operating_guide extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists guide_sections_published_title_trgm_idx
      on payload.guide_sections using gin (title extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists guide_sections_published_slug_trgm_idx
      on payload.guide_sections using gin (section_slug extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists guide_sections_published_summary_trgm_idx
      on payload.guide_sections using gin (summary extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists itineraries_published_title_trgm_idx
      on payload.itineraries using gin (title extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists itineraries_published_slug_trgm_idx
      on payload.itineraries using gin (slug extensions.gin_trgm_ops)
      where workflow_status = 'published';

    create index if not exists itineraries_published_summary_trgm_idx
      on payload.itineraries using gin (summary extensions.gin_trgm_ops)
      where workflow_status = 'published';
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    drop index if exists payload.itineraries_published_summary_trgm_idx;
    drop index if exists payload.itineraries_published_slug_trgm_idx;
    drop index if exists payload.itineraries_published_title_trgm_idx;
    drop index if exists payload.guide_sections_published_summary_trgm_idx;
    drop index if exists payload.guide_sections_published_slug_trgm_idx;
    drop index if exists payload.guide_sections_published_title_trgm_idx;
    drop index if exists payload.neighborhoods_published_operating_guide_trgm_idx;
    drop index if exists payload.neighborhoods_published_slug_trgm_idx;
    drop index if exists payload.neighborhoods_published_name_trgm_idx;
    drop index if exists payload.guide_items_public_arabic_summary_trgm_idx;
    drop index if exists payload.guide_items_public_arabic_title_trgm_idx;
    drop index if exists payload.guide_items_public_category_trgm_idx;
    drop index if exists payload.guide_items_public_area_trgm_idx;
    drop index if exists payload.guide_items_public_summary_trgm_idx;
    drop index if exists payload.guide_items_public_slug_trgm_idx;
    drop index if exists payload.guide_items_public_title_trgm_idx;
    drop index if exists payload.countries_name_trgm_idx;
    drop index if exists payload.cities_public_slug_trgm_idx;
    drop index if exists payload.cities_public_name_trgm_idx;
  `);
}
