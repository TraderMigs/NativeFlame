# Native Flame Candle Company

E-commerce website for Native Flame Candle Co. — Buffalo Gap, Texas.

## Tech Stack
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: Supabase (products, orders, auth, storage)
- **Payments**: Stripe + PayPal (configurable)
- **Hosting**: Vercel

## Environment Variables (add to Vercel)

```
VITE_SUPABASE_URL=https://xhsddzzigavjbybcogul.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_PAYPAL_CLIENT_ID=your_paypal_client_id
```

## Pages
- `/` — Homepage
- `/shop` — Full product catalog
- `/product/:id` — Individual product
- `/cart` — Cart page
- `/checkout` — Checkout (Stripe + PayPal)
- `/about` — Brand story
- `/order-confirmation` — Post-purchase
- `/admin/login` — Admin sign in
- `/admin` — Admin dashboard
- `/admin/products` — Manage products
- `/admin/orders` — View orders

## Admin Setup
1. Go to Supabase → Authentication → Users → Add User
2. Enter: nativeflamecandles@gmail.com + a password
3. Visit yoursite.vercel.app/admin/login to sign in
