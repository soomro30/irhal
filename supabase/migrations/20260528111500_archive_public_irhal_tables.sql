create schema if not exists legacy_irhal_public;

comment on schema legacy_irhal_public is
  'Archived pre-Payload Irhal public tables. Payload CMS is canonical in the payload schema.';

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'irhal_guide_items',
    'irhal_guide_sections',
    'irhal_itineraries',
    'irhal_listings',
    'irhal_neighborhoods',
    'irhal_districts',
    'irhal_cities',
    'irhal_countries',
    'irhal_ai_jobs',
    'irhal_update_logs'
  ]
  loop
    if to_regclass(format('public.%I', table_name)) is not null then
      execute format('alter table public.%I set schema legacy_irhal_public', table_name);
    end if;
  end loop;
end $$;
