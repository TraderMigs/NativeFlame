-- ============================================
-- NATIVE FLAME CANDLE CO. — SUPABASE SCHEMA
-- Run this in: Supabase → SQL Editor → New Query
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── PRODUCTS TABLE ──────────────────────────
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  collection text not null default 'Standard',
  description text,
  scent_notes text,
  price decimal(10,2) not null,
  size_oz decimal(5,1) not null default 7.0,
  stock integer not null default 0,
  images text[] default '{}',
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ── ORDERS TABLE ────────────────────────────
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb,
  items jsonb not null,
  subtotal decimal(10,2) not null,
  shipping decimal(10,2) not null default 0,
  total decimal(10,2) not null,
  payment_method text not null,
  payment_id text,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- ── ROW LEVEL SECURITY ──────────────────────

-- Products: anyone can read active ones; only admin (authenticated) can write
alter table products enable row level security;

create policy "Public can view active products"
on products for select
using (is_active = true);

create policy "Admins can manage all products"
on products for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- Orders: anyone can insert (place an order); only admin can read/update
alter table orders enable row level security;

create policy "Anyone can place an order"
on orders for insert
with check (true);

create policy "Admins can view and manage orders"
on orders for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- ── STORAGE BUCKET ──────────────────────────

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "Public can view product images"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "Admins can upload product images"
on storage.objects for insert
with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Admins can update product images"
on storage.objects for update
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

create policy "Admins can delete product images"
on storage.objects for delete
using (bucket_id = 'product-images' and auth.role() = 'authenticated');

-- ── SAMPLE PRODUCTS ─────────────────────────
-- These load the candles we already see in the branding images

insert into products (name, collection, description, scent_notes, price, size_oz, stock, is_active)
values
(
  'Turnbow',
  'Turnbow Collection',
  'A rich, earthy blend inspired by wide open Texas skies and cedar country. The Turnbow collection honors the land and the family names that built it — rugged, honest, and deeply rooted.',
  'Cedar, Aged Leather, Smoked Oak, Warm Vanilla',
  28.00, 7.0, 25, true
),
(
  'Whispering Rain',
  'Standard',
  'Close your eyes and breathe deep — fresh rain falling over wildflowers and cool creek stones. Clean, calm, and beautifully simple.',
  'Petrichor, Wildflower, Fresh Water, Light Moss',
  24.00, 8.0, 30, true
),
(
  'Moonwind',
  'Standard',
  'A soft, dreamy blend that floats through the night air like moonlight through pine needles. Perfect for winding down after a long day.',
  'Night Jasmine, Sandalwood, White Musk, Cool Mint',
  24.00, 7.0, 20, true
),
(
  'Golden Ember',
  'Standard',
  'Warm and inviting, like the last glow of a campfire under a star-filled Texas sky. A hug in candle form — comfort in every burn.',
  'Amber, Warm Spice, Toasted Vanilla, Honey',
  24.00, 7.0, 15, true
),
(
  'Morning Fire',
  'Standard',
  'Bold and bright — citrus sparks and warm spice that ignite the senses first thing in the morning. Rise and shine, Texas style.',
  'Blood Orange, Cinnamon, Clove, Warm Amber',
  24.00, 7.0, 18, true
),
(
  'Black Cypress & Cassis',
  'Premium Dark',
  'Deep, complex, and impossibly elegant. Dark berries meet ancient cypress for a scent that commands a room and lingers in memory.',
  'Black Cassis, Cypress, Dark Patchouli, Bergamot',
  32.00, 7.0, 12, true
),
(
  'Midnight Saddle',
  'Premium Dark',
  'Rugged and refined. Leather, tobacco, and the smell of a horse barn at dusk — for those who live unapologetically and love the land they ride.',
  'Rich Leather, Tobacco Leaf, Dark Musk, Cedarwood',
  32.00, 7.0, 10, true
);
