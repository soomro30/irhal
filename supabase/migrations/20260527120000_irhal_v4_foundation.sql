create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.irhal_workflow_status as enum ('draft', 'review', 'approved', 'published', 'updated', 'archived');
create type public.irhal_listing_type as enum ('place', 'hotel', 'restaurant', 'masjid', 'shopping', 'tour', 'islamic-landmark', 'prayer-area');
create type public.irhal_agent_status as enum ('queued', 'running', 'completed', 'failed', 'blocked');

create table public.irhal_cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null,
  region text,
  locale text not null default 'en',
  lede text not null check (char_length(lede) <= 650),
  timezone text not null,
  currency text not null,
  languages text[] not null default '{}',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  geo extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  map_url text not null,
  fast_facts jsonb not null default '[]'::jsonb,
  structured_sections jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  last_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.irhal_districts (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  name text not null,
  slug text not null,
  zone text not null,
  summary text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  geo extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  map_url text not null,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table public.irhal_neighborhoods (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  district_id uuid not null references public.irhal_districts(id) on delete restrict,
  name text not null,
  slug text not null,
  cluster_type text not null,
  operating_guide text not null,
  best_for text[] not null default '{}',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  geo extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  map_url text not null,
  live_map_queries jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table public.irhal_listings (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  neighborhood_id uuid not null references public.irhal_neighborhoods(id) on delete restrict,
  listing_type public.irhal_listing_type not null,
  name text not null,
  slug text not null,
  short_description text not null,
  address text not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  geo extensions.geography(Point, 4326) generated always as (
    extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography
  ) stored,
  map_url text not null,
  phone text,
  website text,
  opening_hours jsonb,
  price_range text,
  affiliate_url text,
  muslim_travel jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  embedding extensions.vector(1536),
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  last_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, listing_type, slug),
  constraint irhal_listings_geo_required check (latitude is not null and longitude is not null and map_url <> '')
);

create table public.irhal_itineraries (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.irhal_cities(id) on delete cascade,
  title text not null,
  slug text not null,
  duration_days integer not null check (duration_days between 1 and 30),
  audience text not null,
  summary text not null,
  days jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table public.irhal_ai_jobs (
  id uuid primary key default gen_random_uuid(),
  agent text not null,
  task_type text not null,
  status public.irhal_agent_status not null default 'queued',
  input jsonb not null,
  output jsonb,
  validation_report jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.irhal_update_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_slug text not null,
  change_type text not null,
  summary text not null,
  source_snapshot jsonb not null,
  verified_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index irhal_cities_geo_idx on public.irhal_cities using gist (geo);
create index irhal_neighborhoods_geo_idx on public.irhal_neighborhoods using gist (geo);
create index irhal_listings_geo_idx on public.irhal_listings using gist (geo);
create index irhal_listings_embedding_idx on public.irhal_listings using hnsw (embedding extensions.vector_cosine_ops);
create index irhal_listings_name_trgm_idx on public.irhal_listings using gin (name extensions.gin_trgm_ops);
create index irhal_cities_workflow_idx on public.irhal_cities (workflow_status);
create index irhal_listings_type_workflow_idx on public.irhal_listings (listing_type, workflow_status);

create or replace function public.irhal_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger irhal_cities_touch_updated_at
before update on public.irhal_cities
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_districts_touch_updated_at
before update on public.irhal_districts
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_neighborhoods_touch_updated_at
before update on public.irhal_neighborhoods
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_listings_touch_updated_at
before update on public.irhal_listings
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_itineraries_touch_updated_at
before update on public.irhal_itineraries
for each row execute function public.irhal_touch_updated_at();

create trigger irhal_ai_jobs_touch_updated_at
before update on public.irhal_ai_jobs
for each row execute function public.irhal_touch_updated_at();

alter table public.irhal_cities enable row level security;
alter table public.irhal_districts enable row level security;
alter table public.irhal_neighborhoods enable row level security;
alter table public.irhal_listings enable row level security;
alter table public.irhal_itineraries enable row level security;
alter table public.irhal_ai_jobs enable row level security;
alter table public.irhal_update_logs enable row level security;

create policy "Published cities are public" on public.irhal_cities
for select using (workflow_status in ('published', 'updated'));

create policy "Published districts are public" on public.irhal_districts
for select using (workflow_status in ('published', 'updated'));

create policy "Published neighborhoods are public" on public.irhal_neighborhoods
for select using (workflow_status in ('published', 'updated'));

create policy "Published listings are public" on public.irhal_listings
for select using (workflow_status in ('published', 'updated'));

create policy "Published itineraries are public" on public.irhal_itineraries
for select using (workflow_status in ('published', 'updated'));
