create table if not exists public.irhal_countries (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  iso2 char(2) not null unique,
  iso3 char(3) not null unique,
  region text not null,
  subregion text,
  capital text,
  currency text not null,
  languages text[] not null default '{}',
  calling_codes text[] not null default '{}',
  summary text not null,
  flag_emoji text,
  seo jsonb not null default '{}'::jsonb,
  workflow_status public.irhal_workflow_status not null default 'draft',
  sources jsonb not null default '[]'::jsonb,
  last_verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.irhal_countries enable row level security;

drop policy if exists "Published countries are public" on public.irhal_countries;
create policy "Published countries are public" on public.irhal_countries
for select using (workflow_status in ('published', 'updated'));

drop policy if exists "Service role manages countries" on public.irhal_countries;
create policy "Service role manages countries" on public.irhal_countries
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create trigger irhal_countries_touch_updated_at
before update on public.irhal_countries
for each row execute function public.irhal_touch_updated_at();

insert into public.irhal_countries (
  name,
  slug,
  iso2,
  iso3,
  region,
  subregion,
  capital,
  currency,
  languages,
  calling_codes,
  summary,
  flag_emoji,
  seo,
  workflow_status,
  sources,
  last_verified_at
) values (
  'Pakistan',
  'pakistan',
  'PK',
  'PAK',
  'Asia',
  'Southern Asia',
  'Islamabad',
  'PKR',
  array['Urdu', 'English', 'Sindhi'],
  array['+92'],
  'Pakistan country record for Irhal city guides, beginning with the Karachi enterprise guide model.',
  'PK',
  '{"title":"Pakistan Travel Guides | Irhal AI Travel","description":"Structured Irhal travel guides for cities in Pakistan.","robots":"index,follow","schemaType":"Country"}'::jsonb,
  'published',
  '[{"label":"Karachi_Pakistan_City_Guide_Irhal_Enterprise_FULL_2026.docx","url":"local-docx-import","type":"editorial","verifiedAt":"2026-05-25","confidence":"high"}]'::jsonb,
  '2026-05-25'
) on conflict (slug) do update set
  name = excluded.name,
  iso2 = excluded.iso2,
  iso3 = excluded.iso3,
  region = excluded.region,
  subregion = excluded.subregion,
  capital = excluded.capital,
  currency = excluded.currency,
  languages = excluded.languages,
  calling_codes = excluded.calling_codes,
  summary = excluded.summary,
  flag_emoji = excluded.flag_emoji,
  seo = excluded.seo,
  workflow_status = excluded.workflow_status,
  sources = excluded.sources,
  last_verified_at = excluded.last_verified_at;

alter table public.irhal_cities
add column if not exists country_id uuid references public.irhal_countries(id) on delete restrict;

update public.irhal_cities
set country_id = public.irhal_countries.id
from public.irhal_countries
where public.irhal_cities.country = public.irhal_countries.name
  and public.irhal_cities.country_id is null;

alter table public.irhal_cities
alter column country_id set not null;

create index if not exists irhal_countries_workflow_idx on public.irhal_countries (workflow_status);
create index if not exists irhal_cities_country_idx on public.irhal_cities (country_id, workflow_status);
