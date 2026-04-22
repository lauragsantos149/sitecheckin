update public.packages
set
  price_cents = 6000,
  validity_days = 15
where credits = 1;

update public.packages
set
  price_cents = 20000,
  validity_days = 60
where credits = 4;

update public.packages
set
  price_cents = 32000,
  validity_days = 90
where credits = 8;
