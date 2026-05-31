import {
  type MigrateDownArgs,
  type MigrateUpArgs,
  sql,
} from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    alter table payload.guide_items
      add column if not exists neighborhood_id integer;

    alter table payload._guide_items_v
      add column if not exists version_neighborhood_id integer;

    do $$
    begin
      alter table payload.guide_items
        add constraint guide_items_neighborhood_id_neighborhoods_id_fk
        foreign key (neighborhood_id) references payload.neighborhoods(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    do $$
    begin
      alter table payload._guide_items_v
        add constraint _guide_items_v_version_neighborhood_id_neighborhoods_id_fk
        foreign key (version_neighborhood_id) references payload.neighborhoods(id)
        on delete set null on update no action;
    exception
      when duplicate_object then null;
    end $$;

    create index if not exists guide_items_neighborhood_idx
      on payload.guide_items using btree (neighborhood_id);

    create index if not exists _guide_items_v_version_neighborhood_idx
      on payload._guide_items_v using btree (version_neighborhood_id);
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    drop index if exists payload._guide_items_v_version_neighborhood_idx;
    drop index if exists payload.guide_items_neighborhood_idx;

    alter table payload._guide_items_v
      drop constraint if exists _guide_items_v_version_neighborhood_id_neighborhoods_id_fk;

    alter table payload.guide_items
      drop constraint if exists guide_items_neighborhood_id_neighborhoods_id_fk;

    alter table payload._guide_items_v
      drop column if exists version_neighborhood_id;

    alter table payload.guide_items
      drop column if exists neighborhood_id;
  `);
}
