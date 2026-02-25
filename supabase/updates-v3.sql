-- ============================================================
-- NATIVE FLAME — UPDATE SCRIPT v3
-- Run in: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. Add product_type column (if not already done from v2)
alter table products add column if not exists product_type text not null default 'candle';
update products set product_type = 'candle' where product_type is null or product_type = '';

-- 2. Rename Premium Dark → Coffee House Collection (safe to re-run)
update products set collection = 'Coffee House Collection' where collection = 'Premium Dark';

-- 3. Fix Turnbow scent notes — Leather, Bourbon, Smoke, Sweet Berries (no cedar)
update products set
  scent_notes = 'Rich Leather, Kentucky Bourbon, Wood Smoke, Sweet Dark Berries',
  description = 'Turnbow is Jennifer''s signature scent — bold, complex, and deeply personal. Rich leather and bourbon meet wood smoke and sweet dark berries in an unforgettable pour.'
where name ilike '%turnbow%';

-- 4. Email subscribers table
create table if not exists email_subscribers (
  id            uuid primary key default uuid_generate_v4(),
  email         text not null unique,
  discount_code text not null default 'WELCOME15',
  subscribed_at timestamptz default now()
);
alter table email_subscribers enable row level security;
drop policy if exists "Anyone can subscribe"        on email_subscribers;
drop policy if exists "Admins can view subscribers" on email_subscribers;
create policy "Anyone can subscribe"        on email_subscribers for insert with check (true);
create policy "Admins can view subscribers" on email_subscribers for select using (auth.role() = 'authenticated');

-- 5. Site settings table (stores colors + content)
create table if not exists site_settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz default now()
);
alter table site_settings enable row level security;
drop policy if exists "Public can read settings"  on site_settings;
drop policy if exists "Admins can write settings" on site_settings;
create policy "Public can read settings"  on site_settings for select using (true);
create policy "Admins can write settings" on site_settings for all    using (auth.role() = 'authenticated');

select 'v3 complete ✅ — product_type, Coffee House, Turnbow, email_subscribers, site_settings all set.' as status;
