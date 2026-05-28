create index if not exists irhal_listings_neighborhood_idx on public.irhal_listings (neighborhood_id);
create index if not exists irhal_neighborhoods_district_idx on public.irhal_neighborhoods (district_id);

drop policy if exists "Service role manages countries" on public.irhal_countries;
