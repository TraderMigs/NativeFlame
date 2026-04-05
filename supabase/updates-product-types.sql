-- ============================================================
-- NATIVE FLAME — PRODUCT TYPES TABLE
-- Run in: Supabase → SQL Editor → New Query → Paste → Run
-- ============================================================

create table if not exists product_types (
  id         uuid primary key default uuid_generate_v4(),
  slug       text not null unique,
  label      text not null,
  icon       text not null default '📦',
  sort_order integer not null default 0,
  is_active  boolean not null default true,
  created_at timestamptz default now()
);

alter table product_types enable row level security;

drop policy if exists "Public can read active types" on product_types;
drop policy if exists "Admins can manage types"      on product_types;

create policy "Public can read active types"
  on product_types for select using (is_active = true);

create policy "Admins can manage types"
  on product_types for all using (auth.role() = 'authenticated');

-- Seed the 4 existing types
insert into product_types (slug, label, icon, sort_order, is_active) values
  ('candle',        'Candles',        '🕯️', 1, true),
  ('wax_melt',      'Wax Melts',      '🫧', 2, true),
  ('room_spray',    'Room Sprays',    '🌿', 3, true),
  ('car_freshener', 'Car Fresheners', '🚗', 4, true)
on conflict (slug) do nothing;

select 'Product types table ready with 4 default tabs seeded.' as status;
