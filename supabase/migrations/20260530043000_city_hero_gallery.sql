create table if not exists payload.cities_hero_gallery (
  _order integer not null,
  _parent_id integer not null,
  id varchar primary key not null,
  image_id integer
);

create table if not exists payload._cities_v_version_hero_gallery (
  _order integer not null,
  _parent_id integer not null,
  id serial primary key not null,
  image_id integer,
  _uuid varchar
);

do $$
begin
  alter table payload.cities_hero_gallery
    add constraint cities_hero_gallery_parent_id_fk
    foreign key (_parent_id) references payload.cities(id)
    on delete cascade on update no action;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table payload.cities_hero_gallery
    add constraint cities_hero_gallery_image_id_media_id_fk
    foreign key (image_id) references payload.media(id)
    on delete set null on update no action;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table payload._cities_v_version_hero_gallery
    add constraint _cities_v_version_hero_gallery_parent_id_fk
    foreign key (_parent_id) references payload._cities_v(id)
    on delete cascade on update no action;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table payload._cities_v_version_hero_gallery
    add constraint _cities_v_version_hero_gallery_image_id_media_id_fk
    foreign key (image_id) references payload.media(id)
    on delete set null on update no action;
exception
  when duplicate_object then null;
end $$;

create index if not exists cities_hero_gallery_order_idx on payload.cities_hero_gallery using btree (_order);
create index if not exists cities_hero_gallery_parent_id_idx on payload.cities_hero_gallery using btree (_parent_id);
create index if not exists cities_hero_gallery_image_idx on payload.cities_hero_gallery using btree (image_id);
create index if not exists _cities_v_version_hero_gallery_order_idx on payload._cities_v_version_hero_gallery using btree (_order);
create index if not exists _cities_v_version_hero_gallery_parent_id_idx on payload._cities_v_version_hero_gallery using btree (_parent_id);
create index if not exists _cities_v_version_hero_gallery_image_idx on payload._cities_v_version_hero_gallery using btree (image_id);
