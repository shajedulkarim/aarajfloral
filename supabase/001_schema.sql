-- 001_schema.sql
-- Core tables, RLS, order logging trigger, storage bucket, seed data.
-- Safe to re-run. Run this first, in the Supabase SQL Editor.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- permissions helper
-- Before 002 exists, any signed-in user counts as an admin. 002 replaces this
-- function with a real per-person check. The guard stops a re-run of 001 from
-- weakening it after 002 has been applied.
do $do$
begin
  if to_regclass('public.staff_profiles') is null then
    execute $f$
      create or replace function public.has_perm(p text)
      returns boolean language sql stable security definer set search_path = public as
      $b$ select auth.uid() is not null $b$
    $f$;
  end if;
end
$do$;

-- ---------------------------------------------------------------- tables
create table if not exists public.menu_categories (
  id         text primary key,
  name_en    text not null,
  name_ar    text not null default '',
  sort       int  not null default 0,
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.menu_items (
  id          uuid primary key default gen_random_uuid(),
  category_id text not null references public.menu_categories(id) on update cascade on delete cascade,
  name_en     text not null,
  name_ar     text not null default '',
  desc_en     text not null default '',
  desc_ar     text not null default '',
  price       numeric(10,3) not null default 0 check (price >= 0),
  image_url   text,
  hidden      boolean not null default false,
  sold_out    boolean not null default false,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists menu_items_cat_idx on public.menu_items(category_id, sort);

create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  section      text not null check (section in ('hero','gallery','shop','catalogue')),
  url          text not null,
  original_url text,
  storage_path text,
  alt_en       text not null default '',
  alt_ar       text not null default '',
  sort         int not null default 0,
  created_at   timestamptz not null default now()
);

create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  created_at    timestamptz not null default now(),
  customer_name text check (customer_name is null or char_length(customer_name) <= 80),
  phone         text check (phone is null or char_length(phone) <= 30),
  items         jsonb not null,
  total         numeric(10,3) not null default 0,
  fulfilment    text not null default 'pickup' check (fulfilment in ('pickup','delivery')),
  note          text check (note is null or char_length(note) <= 400),
  lang          text not null default 'en',
  status        text not null default 'new' check (status in ('new','preparing','ready','done','cancelled')),
  updated_at    timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists orders_status_idx on public.orders(status);

-- ---------------------------------------------------------------- triggers
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists trg_items_touch on public.menu_items;
create trigger trg_items_touch before update on public.menu_items for each row execute function public.touch_updated_at();
drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- Public orders: ignore client-supplied totals and status. Prices come from the menu.
create or replace function public.orders_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  line jsonb; clean jsonb := '[]'::jsonb; sum numeric := 0; q int; p numeric; nm text; mid uuid;
begin
  if jsonb_typeof(new.items) <> 'array' or jsonb_array_length(new.items) = 0 or jsonb_array_length(new.items) > 40 then
    raise exception 'order needs between 1 and 40 lines';
  end if;
  for line in select * from jsonb_array_elements(new.items) loop
    q := least(greatest(coalesce((line->>'qty')::int, 1), 1), 99);
    begin mid := (line->>'id')::uuid; exception when others then mid := null; end;
    select price, name_en into p, nm from menu_items where id = mid;
    if p is null then
      -- unknown id (for example bundled default items): keep the line, cap the price, flag it
      p := least(greatest(coalesce((line->>'price')::numeric, 0), 0), 1000);
      nm := left(coalesce(line->>'name', 'Item'), 120);
    end if;
    sum := sum + p * q;
    clean := clean || jsonb_build_object('id', coalesce(line->>'id',''), 'name', nm, 'qty', q, 'price', p, 'known', mid is not null and exists (select 1 from menu_items where id = mid));
  end loop;
  new.items := clean;
  new.total := sum;
  new.status := 'new';
  new.created_at := now();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists trg_orders_before_insert on public.orders;
create trigger trg_orders_before_insert before insert on public.orders for each row execute function public.orders_before_insert();

-- ---------------------------------------------------------------- RPCs
create or replace function public.set_availability(p_id uuid, p_sold_out boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.has_perm('availability') or public.has_perm('menu')) then raise exception 'not allowed' using errcode = '42501'; end if;
  update menu_items set sold_out = p_sold_out where id = p_id;
end $$;

-- p: [{"id": "...", "price": 12.5}, ...]
create or replace function public.bulk_set_prices(p jsonb) returns int
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.has_perm('menu') then raise exception 'not allowed' using errcode = '42501'; end if;
  update menu_items m set price = greatest((x->>'price')::numeric, 0)
  from jsonb_array_elements(p) x where m.id = (x->>'id')::uuid;
  get diagnostics n = row_count;
  return n;
end $$;

-- p: [{"id": "...", "sort": 3}, ...]
create or replace function public.reorder_items(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.has_perm('menu') then raise exception 'not allowed' using errcode = '42501'; end if;
  update menu_items m set sort = (x->>'sort')::int from jsonb_array_elements(p) x where m.id = (x->>'id')::uuid;
end $$;

-- ---------------------------------------------------------------- RLS
alter table public.menu_categories enable row level security;
alter table public.menu_items      enable row level security;
alter table public.photos          enable row level security;
alter table public.settings        enable row level security;
alter table public.orders          enable row level security;

-- menu_categories
drop policy if exists cat_public_read on public.menu_categories;
create policy cat_public_read on public.menu_categories for select to anon, authenticated using (not hidden or public.has_perm('menu') or public.has_perm('availability'));
drop policy if exists cat_write on public.menu_categories;
create policy cat_write on public.menu_categories for all to authenticated using (public.has_perm('menu')) with check (public.has_perm('menu'));

-- menu_items
drop policy if exists item_public_read on public.menu_items;
create policy item_public_read on public.menu_items for select to anon, authenticated using (not hidden or public.has_perm('menu') or public.has_perm('availability'));
drop policy if exists item_write on public.menu_items;
create policy item_write on public.menu_items for all to authenticated using (public.has_perm('menu')) with check (public.has_perm('menu'));

-- photos
drop policy if exists photo_public_read on public.photos;
create policy photo_public_read on public.photos for select to anon, authenticated using (true);
drop policy if exists photo_write on public.photos;
create policy photo_write on public.photos for all to authenticated using (public.has_perm('photos')) with check (public.has_perm('photos'));

-- settings
drop policy if exists set_public_read on public.settings;
create policy set_public_read on public.settings for select to anon, authenticated using (true);
drop policy if exists set_write on public.settings;
create policy set_write on public.settings for all to authenticated using (public.has_perm('settings')) with check (public.has_perm('settings'));

-- orders: public may insert only. Staff read and update by permission.
drop policy if exists order_public_insert on public.orders;
create policy order_public_insert on public.orders for insert to anon, authenticated with check (true);
drop policy if exists order_read on public.orders;
create policy order_read on public.orders for select to authenticated using (public.has_perm('orders') or public.has_perm('insights'));
drop policy if exists order_update on public.orders;
create policy order_update on public.orders for update to authenticated using (public.has_perm('orders')) with check (public.has_perm('orders'));
drop policy if exists order_delete on public.orders;
create policy order_delete on public.orders for delete to authenticated using (public.has_perm('settings'));

-- table privileges (RLS still decides rows)
grant usage on schema public to anon, authenticated;
grant select on public.menu_categories, public.menu_items, public.photos, public.settings to anon, authenticated;
grant insert on public.orders to anon, authenticated;
grant select, update, delete on public.orders to authenticated;
grant insert, update, delete on public.menu_categories, public.menu_items, public.photos, public.settings to authenticated;
grant execute on function public.has_perm(text) to anon, authenticated;
grant execute on function public.set_availability(uuid, boolean) to authenticated;
grant execute on function public.bulk_set_prices(jsonb) to authenticated;
grant execute on function public.reorder_items(jsonb) to authenticated;
revoke execute on function public.orders_before_insert() from public, anon, authenticated;

-- realtime for the live orders list
do $do$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end $do$;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public) values ('photos', 'photos', true) on conflict (id) do update set public = true;

drop policy if exists photos_read on storage.objects;
create policy photos_read on storage.objects for select to anon, authenticated using (bucket_id = 'photos');
drop policy if exists photos_insert on storage.objects;
create policy photos_insert on storage.objects for insert to authenticated with check (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));
drop policy if exists photos_update on storage.objects;
create policy photos_update on storage.objects for update to authenticated using (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));
drop policy if exists photos_delete on storage.objects;
create policy photos_delete on storage.objects for delete to authenticated using (bucket_id = 'photos' and (public.has_perm('photos') or public.has_perm('menu')));

-- ---------------------------------------------------------------- seed (placeholder prices, set real ones in the admin)
insert into public.menu_categories (id, name_en, name_ar, sort) values
  ('hand','Hand bouquets','باقات يدوية',1),
  ('bag','Bag bouquets','باقات الحقيبة',2),
  ('arrangements','Arrangements','تنسيقات',3)
on conflict (id) do nothing;

insert into public.menu_items (id, category_id, name_en, name_ar, desc_en, desc_ar, price, image_url, sort) values
  ('00000000-0000-4000-8000-000000000001','hand','Lily bouquet','باقة زنبق','Pink lilies in clear wrap with a satin bow.','زنبق وردي بتغليف شفاف وشريط ساتان.',18,'assets/img/lily-bouquet.jpg',1),
  ('00000000-0000-4000-8000-000000000002','hand','Pastel wrap bouquet','باقة بألوان الباستيل','Roses, carnations and eucalyptus in blush paper.','ورد وقرنفل وأوكالبتوس بورق وردي فاتح.',22,'assets/img/pink-wrap.jpg',2),
  ('00000000-0000-4000-8000-000000000003','hand','Tulips and baby''s breath','توليب وجيبسوفيلا','Purple tulips with white baby''s breath.','توليب بنفسجي مع جيبسوفيلا بيضاء.',16,'assets/img/tulips.jpg',3),
  ('00000000-0000-4000-8000-000000000004','hand','Red rose bouquet, 100 stems','باقة ورد أحمر، 100 وردة','One hundred red roses in white paper.','مئة وردة حمراء بورق أبيض.',120,'assets/img/red-roses.jpg',4),
  ('00000000-0000-4000-8000-000000000005','bag','Bag bouquet, lilies','باقة حقيبة بالزنبق','Lilies, roses and chrysanthemum in the Aaraj gift bag.','زنبق وورد وأقحوان في حقيبة أعراج.',28,'assets/img/bag-lilies.jpg',1),
  ('00000000-0000-4000-8000-000000000006','bag','Bag bouquet, mixed','باقة حقيبة مشكلة','Seasonal mixed stems in a white gift box.','ورد موسمي مشكل في علبة هدية بيضاء.',30,'assets/img/bag-mixed.jpg',2),
  ('00000000-0000-4000-8000-000000000007','arrangements','Tray arrangement','تنسيق صينية','Low, dense arrangement on a stone-lined tray.','تنسيق منخفض كثيف على صينية بالحصى.',45,'assets/img/arrangement-tray.jpg',1),
  ('00000000-0000-4000-8000-000000000008','arrangements','Hydrangea basket','سلة هيدرانجيا','Pink hydrangea in a woven basket.','هيدرانجيا وردية في سلة منسوجة.',38,'assets/img/hydrangea-basket.jpg',2),
  ('00000000-0000-4000-8000-000000000009','arrangements','Gift box with anthurium','علبة هدية مع أنثوريوم','Anthurium and lilies around a gift box. Box not included.','أنثوريوم وزنبق حول علبة هدية. العلبة غير مشمولة.',55,'assets/img/gift-box-anthurium.jpg',3)
on conflict (id) do nothing;

insert into public.photos (id, section, url, alt_en, alt_ar, sort) values
  ('10000000-0000-4000-8000-000000000001','hero','assets/img/bag-lilies.jpg','Lily and rose bag bouquet','باقة حقيبة بالزنبق والورد',1),
  ('10000000-0000-4000-8000-000000000002','hero','assets/img/red-roses.jpg','One hundred red roses','مئة وردة حمراء',2),
  ('10000000-0000-4000-8000-000000000003','hero','assets/img/pink-wrap.jpg','Pink wrapped bouquet','باقة بتغليف وردي',3),
  ('10000000-0000-4000-8000-000000000004','shop','assets/img/shop-sign.jpg','Aaraj Floral Shop sign','لافتة أعراج للزهور',1),
  ('10000000-0000-4000-8000-000000000005','shop','assets/img/shop-interior.jpg','Inside the shop','داخل المحل',2),
  ('10000000-0000-4000-8000-000000000006','gallery','assets/img/hydrangea-basket.jpg','Hydrangea basket','سلة هيدرانجيا',1),
  ('10000000-0000-4000-8000-000000000007','gallery','assets/img/arrangement-tray.jpg','Tray arrangement','تنسيق صينية',2),
  ('10000000-0000-4000-8000-000000000008','gallery','assets/img/lily-bouquet.jpg','Lily bouquet','باقة زنبق',3),
  ('10000000-0000-4000-8000-000000000009','gallery','assets/img/tulips.jpg','Tulips and baby''s breath','توليب وجيبسوفيلا',4),
  ('10000000-0000-4000-8000-00000000000a','gallery','assets/img/gift-box-anthurium.jpg','Anthurium gift arrangement','تنسيق أنثوريوم',5),
  ('10000000-0000-4000-8000-00000000000b','gallery','assets/img/bag-mixed.jpg','Mixed bag bouquet','باقة حقيبة مشكلة',6)
on conflict (id) do nothing;

insert into public.settings (key, value) values
  ('banner',  '{"active": false, "text_en": "", "text_ar": ""}'),
  ('rating',  '{"show": false, "value": 0, "count": 0}'),
  ('contact', '{"whatsapp":"96877399377","phone":"+968 7739 9377","address_en":"Al Maha Street, Bosher, Muscat, Oman","address_ar":"شارع المها، بوشر، مسقط، سلطنة عُمان","maps_url":"https://www.google.com/maps/search/?api=1&query=Aaraj+Floral+Shop+Bosher+Muscat","instagram":"aaraj.om"}'),
  ('hours',   '{"days":[{"day":0,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]},{"day":1,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]},{"day":2,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]},{"day":3,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]},{"day":4,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]},{"day":5,"open":false,"slots":[]},{"day":6,"open":true,"slots":[["10:00","13:00"],["16:00","22:00"]]}]}')
on conflict (key) do nothing;
