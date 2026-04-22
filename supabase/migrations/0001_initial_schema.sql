-- =====================================================
-- Movimento & Bem-Estar — Schema inicial
-- =====================================================
-- Tabelas:
--   profiles        — extensão de auth.users (nome, telefone, is_admin)
--   class_types     — tipos de aula (Funcional, Funcional+Tênis, ...)
--   class_slots     — aulas agendadas (data+hora, capacidade, status)
--   packages        — pacotes de créditos à venda
--   orders          — pedidos de compra (PIX + comprovante + aprovação)
--   credit_batches  — lotes de créditos liberados após aprovação
--   bookings        — reservas (check-ins) das alunas
--
-- Funções RPC:
--   book_class, cancel_booking
--   approve_order, reject_order
--   admin_cancel_slot, admin_cancel_booking
--   ensure_saturday_slots (gera grade fixa de sábado)
--
-- Views:
--   class_slots_with_counts — slot + nome do tipo + bookings_count
--   user_credit_totals      — total de créditos válidos por usuário
-- =====================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin
  ));

create policy "profiles_self_insert"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Impede aluna comum de virar admin via UPDATE direto no client.
create or replace function public.prevent_self_admin_escalation()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if not exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin
    ) then
      raise exception 'forbidden_admin_change';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_self_admin on public.profiles;
create trigger prevent_self_admin
  before update on public.profiles
  for each row execute function public.prevent_self_admin_escalation();

-- Trigger: cria profile automaticamente ao cadastrar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- class_types ----------
create table if not exists public.class_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#be1865',
  created_at timestamptz not null default now()
);

alter table public.class_types enable row level security;

create policy "class_types_read_all"
  on public.class_types for select
  using (true);

create policy "class_types_admin_write"
  on public.class_types for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ---------- class_slots ----------
create table if not exists public.class_slots (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  duration_minutes int not null default 60,
  class_type_id uuid not null references public.class_types(id),
  capacity int not null default 8 check (capacity > 0),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  unique (starts_at, class_type_id)
);

create index if not exists class_slots_starts_at_idx on public.class_slots(starts_at);

alter table public.class_slots enable row level security;

create policy "class_slots_read_all"
  on public.class_slots for select
  using (true);

create policy "class_slots_admin_write"
  on public.class_slots for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ---------- packages ----------
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  credits int not null check (credits > 0),
  price_cents int not null check (price_cents > 0),
  validity_days int not null check (validity_days > 0),
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "packages_read_active_or_admin"
  on public.packages for select
  using (
    active
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

create policy "packages_admin_write"
  on public.packages for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid not null references public.packages(id),
  package_snapshot jsonb not null,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'cancelled')
  ),
  receipt_url text,
  receipt_uploaded_at timestamptz,
  admin_notes text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_status_idx on public.orders(status);

alter table public.orders enable row level security;

create policy "orders_owner_read"
  on public.orders for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

create policy "orders_owner_insert"
  on public.orders for insert
  with check (user_id = auth.uid() and status = 'pending');

create policy "orders_owner_update_receipt"
  on public.orders for update
  using (user_id = auth.uid() and status = 'pending')
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

create policy "orders_admin_write"
  on public.orders for all
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin));

-- ---------- credit_batches ----------
create table if not exists public.credit_batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  total_credits int not null check (total_credits > 0),
  remaining_credits int not null check (remaining_credits >= 0),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists credit_batches_user_idx on public.credit_batches(user_id);
create index if not exists credit_batches_expiry_idx on public.credit_batches(expires_at);

alter table public.credit_batches enable row level security;

create policy "credit_batches_owner_read"
  on public.credit_batches for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- mutações só via funções security definer

-- ---------- bookings ----------
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  class_slot_id uuid not null references public.class_slots(id) on delete cascade,
  credit_batch_id uuid references public.credit_batches(id) on delete set null,
  status text not null default 'active' check (
    status in ('active', 'cancelled_refund', 'cancelled_no_refund')
  ),
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  attended boolean,
  unique (user_id, class_slot_id)
);

create index if not exists bookings_slot_idx on public.bookings(class_slot_id);
create index if not exists bookings_user_idx on public.bookings(user_id);

alter table public.bookings enable row level security;

create policy "bookings_owner_read"
  on public.bookings for select
  using (
    user_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
  );

-- mutações só via funções security definer

-- ---------- view: class_slots_with_counts ----------
create or replace view public.class_slots_with_counts
with (security_invoker = true)
as
  select
    s.id,
    s.starts_at,
    s.duration_minutes,
    s.class_type_id,
    s.capacity,
    s.status,
    s.notes,
    s.created_at,
    ct.name as class_type_name,
    ct.color as class_type_color,
    coalesce(b.cnt, 0)::int as bookings_count
  from public.class_slots s
  join public.class_types ct on ct.id = s.class_type_id
  left join (
    select class_slot_id, count(*)::int as cnt
    from public.bookings
    where status = 'active'
    group by class_slot_id
  ) b on b.class_slot_id = s.id;

-- ---------- view: user_credit_totals ----------
create or replace view public.user_credit_totals
with (security_invoker = true)
as
  select
    user_id,
    coalesce(sum(remaining_credits), 0)::int as total_remaining
  from public.credit_batches
  where remaining_credits > 0 and expires_at > now()
  group by user_id;

-- =====================================================
-- Funções RPC (security definer onde precisam mutar)
-- =====================================================

-- Reserva uma vaga (check-in)
create or replace function public.book_class(p_slot_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_slot record;
  v_count int;
  v_today_count int;
  v_batch record;
  v_booking_id uuid;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  select * into v_slot
  from public.class_slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception 'slot_not_found';
  end if;
  if v_slot.status = 'cancelled' then
    raise exception 'slot_cancelled';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'slot_started';
  end if;

  if exists (
    select 1 from public.bookings
    where user_id = v_user and class_slot_id = p_slot_id and status = 'active'
  ) then
    raise exception 'already_booked';
  end if;

  select count(*)::int into v_count
  from public.bookings
  where class_slot_id = p_slot_id and status = 'active';
  if v_count >= v_slot.capacity then
    raise exception 'slot_full';
  end if;

  -- limite de 2 check-ins ativos por dia
  select count(*)::int into v_today_count
  from public.bookings b
  join public.class_slots s on s.id = b.class_slot_id
  where b.user_id = v_user
    and b.status = 'active'
    and (s.starts_at at time zone 'America/Sao_Paulo')::date
        = (v_slot.starts_at at time zone 'America/Sao_Paulo')::date;
  if v_today_count >= 2 then
    raise exception 'daily_limit';
  end if;

  -- consome 1 crédito do batch que vence primeiro
  select * into v_batch
  from public.credit_batches
  where user_id = v_user
    and remaining_credits > 0
    and expires_at > now()
  order by expires_at asc
  limit 1
  for update;

  if not found then
    raise exception 'no_credits';
  end if;

  update public.credit_batches
  set remaining_credits = remaining_credits - 1
  where id = v_batch.id;

  insert into public.bookings (user_id, class_slot_id, credit_batch_id)
  values (v_user, p_slot_id, v_batch.id)
  returning id into v_booking_id;

  return v_booking_id;
end;
$$;

revoke all on function public.book_class(uuid) from public;
grant execute on function public.book_class(uuid) to authenticated;

-- Cancela uma reserva (devolve crédito se ≥ 1h antes)
create or replace function public.cancel_booking(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_slot record;
  v_booking record;
  v_can_refund boolean;
begin
  if v_user is null then
    raise exception 'unauthenticated';
  end if;

  select * into v_slot from public.class_slots where id = p_slot_id;
  if not found then raise exception 'slot_not_found'; end if;

  select * into v_booking
  from public.bookings
  where user_id = v_user and class_slot_id = p_slot_id and status = 'active'
  for update;

  if not found then raise exception 'not_booked'; end if;

  v_can_refund := v_slot.starts_at - now() >= interval '1 hour';

  if not v_can_refund then
    -- Regra: < 1h antes do início, não pode cancelar e o crédito é consumido.
    -- A reserva permanece ativa para a Laura ver na lista de presença;
    -- se a aluna não comparecer, o crédito já foi debitado no check-in.
    raise exception 'cancel_too_late';
  end if;

  update public.bookings
  set status = 'cancelled_refund', cancelled_at = now()
  where id = v_booking.id;

  if v_booking.credit_batch_id is not null then
    update public.credit_batches
    set remaining_credits = remaining_credits + 1
    where id = v_booking.credit_batch_id
      and expires_at > now(); -- só devolve se o lote ainda for válido
  end if;
end;
$$;

revoke all on function public.cancel_booking(uuid) from public;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- Admin: aprova pedido e libera créditos
create or replace function public.approve_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_is_admin boolean;
  v_order record;
  v_validity int;
begin
  select is_admin into v_is_admin from public.profiles where id = v_user;
  if not coalesce(v_is_admin, false) then
    raise exception 'forbidden';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if v_order.status <> 'pending' then raise exception 'order_not_pending'; end if;

  v_validity := coalesce((v_order.package_snapshot->>'validity_days')::int, 30);

  insert into public.credit_batches (user_id, order_id, total_credits, remaining_credits, expires_at)
  values (
    v_order.user_id,
    v_order.id,
    (v_order.package_snapshot->>'credits')::int,
    (v_order.package_snapshot->>'credits')::int,
    now() + make_interval(days => v_validity)
  );

  update public.orders
  set status = 'approved', approved_at = now(), approved_by = v_user
  where id = p_order_id;
end;
$$;

revoke all on function public.approve_order(uuid) from public;
grant execute on function public.approve_order(uuid) to authenticated;

-- Admin: rejeita pedido
create or replace function public.reject_order(p_order_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then
    raise exception 'forbidden';
  end if;
  update public.orders
  set status = 'rejected', rejection_reason = nullif(p_reason, ''), approved_by = auth.uid(), approved_at = now()
  where id = p_order_id and status = 'pending';
  if not found then raise exception 'order_not_pending'; end if;
end;
$$;

revoke all on function public.reject_order(uuid, text) from public;
grant execute on function public.reject_order(uuid, text) to authenticated;

-- Admin: cancela aula inteira e devolve créditos a todas
create or replace function public.admin_cancel_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  r record;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then raise exception 'forbidden'; end if;

  for r in
    select id, credit_batch_id from public.bookings
    where class_slot_id = p_slot_id and status = 'active'
  loop
    update public.bookings
    set status = 'cancelled_refund', cancelled_at = now()
    where id = r.id;
    if r.credit_batch_id is not null then
      update public.credit_batches
      set remaining_credits = remaining_credits + 1
      where id = r.credit_batch_id and expires_at > now();
    end if;
  end loop;

  update public.class_slots set status = 'cancelled' where id = p_slot_id;
end;
$$;

revoke all on function public.admin_cancel_slot(uuid) from public;
grant execute on function public.admin_cancel_slot(uuid) to authenticated;

-- Admin: remove uma aluna específica de uma aula e devolve crédito
create or replace function public.admin_cancel_booking(p_booking_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_booking record;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then raise exception 'forbidden'; end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;

  update public.bookings
  set status = 'cancelled_refund', cancelled_at = now()
  where id = p_booking_id;

  if v_booking.credit_batch_id is not null then
    update public.credit_batches
    set remaining_credits = remaining_credits + 1
    where id = v_booking.credit_batch_id and expires_at > now();
  end if;
end;
$$;

revoke all on function public.admin_cancel_booking(uuid) from public;
grant execute on function public.admin_cancel_booking(uuid) to authenticated;

-- Geração de slots fixos de sábado
-- Sat 07h00: Funcional + Tênis | Sat 09h00: Funcional
-- Mantém os próximos N sábados (default 12) sempre populados.
create or replace function public.ensure_saturday_slots(p_weeks_ahead int default 12)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_funcional uuid;
  v_funcional_tenis uuid;
  v_d date;
  v_target date;
  v_inserted int := 0;
  v_starts_07 timestamptz;
  v_starts_09 timestamptz;
begin
  select id into v_funcional from public.class_types where name = 'Funcional';
  select id into v_funcional_tenis from public.class_types where name = 'Funcional + Tênis';
  if v_funcional is null or v_funcional_tenis is null then
    raise exception 'class_types_not_seeded';
  end if;

  v_d := (now() at time zone 'America/Sao_Paulo')::date;

  for i in 0..p_weeks_ahead loop
    v_target := v_d + i;
    -- 6 = saturday (postgres: 0 = sunday, 6 = saturday)
    if extract(dow from v_target) = 6 then
      -- 07:00 BRT = 10:00 UTC (timezone-safe)
      v_starts_07 := (v_target::text || ' 07:00')::timestamp at time zone 'America/Sao_Paulo';
      v_starts_09 := (v_target::text || ' 09:00')::timestamp at time zone 'America/Sao_Paulo';

      insert into public.class_slots (starts_at, class_type_id, capacity, status)
      values (v_starts_07, v_funcional_tenis, 8, 'open')
      on conflict (starts_at, class_type_id) do nothing;
      get diagnostics v_inserted = row_count;

      insert into public.class_slots (starts_at, class_type_id, capacity, status)
      values (v_starts_09, v_funcional, 8, 'open')
      on conflict (starts_at, class_type_id) do nothing;
    end if;
  end loop;

  return v_inserted;
end;
$$;

revoke all on function public.ensure_saturday_slots(int) from public;
grant execute on function public.ensure_saturday_slots(int) to authenticated, service_role;

-- =====================================================
-- Storage bucket: receipts (privado)
-- =====================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Policies: aluna escreve/lê na própria pasta {user_id}/...
create policy "receipts_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (select 1 from public.profiles where id = auth.uid() and is_admin)
    )
  );

create policy "receipts_owner_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "receipts_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Seeds
-- =====================================================
insert into public.class_types (name, color) values
  ('Funcional', '#be1865'),
  ('Funcional + Tênis', '#9d174d')
on conflict (name) do nothing;

insert into public.packages (name, credits, price_cents, validity_days, sort_order) values
  ('1 Crédito (Aula Avulsa)', 1, 6000, 15, 1),
  ('4 Créditos', 4, 15000, 35, 2),
  ('8 Créditos', 8, 25000, 45, 3)
on conflict do nothing;

-- Gera os próximos sábados
select public.ensure_saturday_slots(12);
