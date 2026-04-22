-- Cria profiles faltantes para usuárias antigas (antes de trigger/ajustes)

insert into public.profiles (id, full_name, phone, is_admin)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  u.raw_user_meta_data->>'phone',
  lower(coalesce(u.email, '')) = 'lauragsantos149@hotmail.com'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

update public.profiles p
set is_admin = true
from auth.users u
where p.id = u.id
  and lower(coalesce(u.email, '')) = 'lauragsantos149@hotmail.com';
