create type public.irhal_guide_item_kind as enum ('place', 'hotel', 'restaurant', 'masjid', 'shopping', 'tour', 'family');
create type public.irhal_guide_geo_status as enum ('provider-enrichment-required', 'coordinates-required', 'verified');

create table public.irhal_guide_sections (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  title text not null,
  section_slug text not null,
  section_type text not null default 'editorial',
  summary text not null,
  body jsonb not null default '[]'::jsonb,
  source_import jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, section_slug)
);

create table public.irhal_guide_items (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  guide_section_id uuid references public.irhal_guide_sections(id) on delete set null,
  kind public.irhal_guide_item_kind not null,
  title text not null,
  slug text not null,
  summary text not null,
  body jsonb not null default '[]'::jsonb,
  image_url text,
  image_alt text not null,
  area text,
  category text,
  budget text,
  map_url text,
  geo_status public.irhal_guide_geo_status not null default 'provider-enrichment-required',
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  provider_place_id text,
  imported_details jsonb not null default '{}'::jsonb,
  source_table text,
  source_row_id text,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, kind, slug)
);

create index irhal_guide_sections_city_idx on public.irhal_guide_sections (city_id, workflow_status);
create index irhal_guide_items_city_kind_idx on public.irhal_guide_items (city_id, kind, workflow_status);
create index irhal_guide_items_section_idx on public.irhal_guide_items (guide_section_id);
create index irhal_guide_items_title_trgm_idx on public.irhal_guide_items using gin (title extensions.gin_trgm_ops);

create trigger irhal_guide_sections_touch_updated_at
before update on public.irhal_guide_sections
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_guide_items_touch_updated_at
before update on public.irhal_guide_items
for each row execute function public.irhal_touch_updated_at();

alter table public.irhal_guide_sections enable row level security;
alter table public.irhal_guide_items enable row level security;

create policy "Published guide sections are public" on public.irhal_guide_sections
for select using (workflow_status in ('published', 'updated'));

create policy "Published guide items are public" on public.irhal_guide_items
for select using (workflow_status in ('published', 'updated'));

create policy "Service role manages guide sections" on public.irhal_guide_sections
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role manages guide items" on public.irhal_guide_items
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
