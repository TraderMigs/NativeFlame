-- ============================================
-- NATIVE FLAME — UPDATE SCRIPT v2
-- Run this in: Supabase → SQL Editor → New Query
-- ============================================

-- 1. Add product_type column to products table
alter table products
add column if not exists product_type text not null default 'candle';

-- 2. Set all existing products to type 'candle'
update products set product_type = 'candle' where product_type is null or product_type = '';

-- 3. Rename "Premium Dark" collection to "Coffee House Collection"
update products set collection = 'Coffee House Collection' where collection = 'Premium Dark';

-- 4. Fix Turnbow scent notes (no cedar - Leather, Bourbon, Smoke, Sweet Berries)
update products
set
  scent_notes = 'Rich Leather, Kentucky Bourbon, Wood Smoke, Sweet Dark Berries',
  description = 'Turnbow is Jennifer''s signature scent — bold, complex, and unforgettable. Rich leather and Kentucky bourbon meet wood smoke and sweet dark berries in a pour that''s unapologetically rugged and deeply personal.'
where name = 'Turnbow';

-- 5. Create email subscribers table
create table if not exists email_subscribers (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  discount_code text not null default 'WELCOME15',
  subscribed_at timestamp with time zone default now()
);

-- 6. RLS for email_subscribers
alter table email_subscribers enable row level security;

create policy "Anyone can subscribe"
on email_subscribers for insert
with check (true);

create policy "Admins can view subscribers"
on email_subscribers for select
using (auth.role() = 'authenticated');

-- 7. Done!
select 'Update complete! product_type added, Turnbow fixed, Coffee House Collection set, email_subscribers created.' as status;
