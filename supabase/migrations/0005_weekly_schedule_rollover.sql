-- Atualiza automaticamente a grade semanal 1x por semana (na virada ISO)

create table if not exists public.app_runtime_state (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_runtime_state enable row level security;

create or replace function public.ensure_weekly_schedule_rollover(
  p_weeks_ahead int default 12
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_key text;
  v_last_key text;
begin
  v_week_key := to_char((now() at time zone 'America/Sao_Paulo')::date, 'IYYY-IW');

  select value into v_last_key
  from public.app_runtime_state
  where key = 'weekly_schedule_rollover_week';

  if v_last_key = v_week_key then
    return false;
  end if;

  perform public.ensure_saturday_slots(p_weeks_ahead);

  insert into public.app_runtime_state (key, value, updated_at)
  values ('weekly_schedule_rollover_week', v_week_key, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = excluded.updated_at;

  return true;
end;
$$;

revoke all on function public.ensure_weekly_schedule_rollover(int) from public;
grant execute on function public.ensure_weekly_schedule_rollover(int) to authenticated, service_role;
