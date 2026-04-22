-- Ajustes de operação:
-- 1) Garante os pacotes oficiais na seção Comprar Créditos
-- 2) Define lauragsantos149@hotmail.com como admin

update public.packages
set
  name = '1 Crédito (Aula Avulsa)',
  price_cents = 6000,
  validity_days = 15,
  sort_order = 1,
  active = true
where credits = 1;

insert into public.packages (name, credits, price_cents, validity_days, sort_order, active)
select '1 Crédito (Aula Avulsa)', 1, 6000, 15, 1, true
where not exists (select 1 from public.packages where credits = 1);

update public.packages
set
  name = '4 Créditos',
  price_cents = 15000,
  validity_days = 35,
  sort_order = 2,
  active = true
where credits = 4;

insert into public.packages (name, credits, price_cents, validity_days, sort_order, active)
select '4 Créditos', 4, 15000, 35, 2, true
where not exists (select 1 from public.packages where credits = 4);

update public.packages
set
  name = '8 Créditos',
  price_cents = 25000,
  validity_days = 45,
  sort_order = 3,
  active = true
where credits = 8;

insert into public.packages (name, credits, price_cents, validity_days, sort_order, active)
select '8 Créditos', 8, 25000, 45, 3, true
where not exists (select 1 from public.packages where credits = 8);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    lower(coalesce(new.email, '')) = 'lauragsantos149@hotmail.com'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    phone = excluded.phone,
    is_admin = public.profiles.is_admin or excluded.is_admin;

  return new;
end;
$$;

update public.profiles p
set is_admin = true
from auth.users u
where p.id = u.id
  and lower(u.email) = 'lauragsantos149@hotmail.com';
