create or replace function public.irhal_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create policy "Service role manages AI jobs" on public.irhal_ai_jobs
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

create policy "Service role reads update logs" on public.irhal_update_logs
for select using (auth.role() = 'service_role');

create policy "Service role writes update logs" on public.irhal_update_logs
for insert with check (auth.role() = 'service_role');
