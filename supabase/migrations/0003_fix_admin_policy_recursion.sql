-- Evita recursão infinita de RLS ao checar admin via tabela profiles

create or replace function public.is_current_user_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_admin
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to anon, authenticated;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id or public.is_current_user_admin());

drop policy if exists "class_types_admin_write" on public.class_types;
create policy "class_types_admin_write"
  on public.class_types for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "class_slots_admin_write" on public.class_slots;
create policy "class_slots_admin_write"
  on public.class_slots for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "packages_read_active_or_admin" on public.packages;
create policy "packages_read_active_or_admin"
  on public.packages for select
  using (active or public.is_current_user_admin());

drop policy if exists "packages_admin_write" on public.packages;
create policy "packages_admin_write"
  on public.packages for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "orders_owner_read" on public.orders;
create policy "orders_owner_read"
  on public.orders for select
  using (user_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "orders_admin_write" on public.orders;
create policy "orders_admin_write"
  on public.orders for all
  using (public.is_current_user_admin())
  with check (public.is_current_user_admin());

drop policy if exists "credit_batches_owner_read" on public.credit_batches;
create policy "credit_batches_owner_read"
  on public.credit_batches for select
  using (user_id = auth.uid() or public.is_current_user_admin());

drop policy if exists "bookings_owner_read" on public.bookings;
create policy "bookings_owner_read"
  on public.bookings for select
  using (user_id = auth.uid() or public.is_current_user_admin());
