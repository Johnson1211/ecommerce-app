# TechStore - Full-Stack E-Commerce App

A complete e-commerce web application built with React, Tailwind CSS, Supabase, and Paystack.

## Features

- **Authentication**: Shared login/register for users and admins via Supabase Auth
- **Storefront**: Dynamic categories, product browsing, cart, checkout
- **Payments**: Paystack integration for GHS payments
- **Admin Panel**: Full CRUD for users, products, categories, data packages, orders
- **Data Bundles**: MTN, AirtelTigo, Telecel packages
- **Digital Products**: PSD files with download links after payment
- **Responsive**: Mobile-first design with Tailwind CSS

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Supabase (Auth, Database, Storage, RLS)
- Paystack Inline JS
- Lucide React (icons)

## Setup

### 1. Clone & Install

```bash
cd ecommerce-app
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor → New Query
3. Copy the contents of `supabase/migrations/001_initial_schema.sql` and run it
4. Enable Storage buckets: `product-images` and `digital-files`
5. Set bucket policies to public for read, authenticated for write

### 3. Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

### 4. Run

```bash
npm run dev
```

### 5. Create First Admin

Option A: Update a user's role directly in Supabase Dashboard → Table Editor → profiles → set `role` to `admin`

Option B: Use the seed script or register normally then promote via SQL:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## Database Schema

### Tables
- `profiles` - User profiles with roles
- `categories` - Product categories (dynamic storefront sections)
- `products` - Physical and digital products
- `data_packages` - Mobile data bundles
- `orders` - Order records with Paystack references
- `cart` - Server-side cart (optional, falls back to localStorage)
- `store_settings` - Store configuration

### RLS Policies
- Users: read own profile, Admins: full access
- Products/Categories: public read, admin write
- Orders: users read own, admins read all
- Cart: users manage own

## Project Structure

```
src/
  components/
    ui/           - Reusable UI (Button, Modal, Toast, Card, Skeleton, Badge)
    layout/       - Navbar, Footer, AdminSidebar
    auth/         - LoginForm, RegisterForm
    store/        - ProductCard, CartItem, DataPackageCard
    admin/        - Admin-specific components
  pages/
    auth/         - Login, Register
    store/        - Home, DataBundles, CategoryPage, Cart, Checkout, OrderConfirmation, Profile
    admin/        - Dashboard, Users, Categories, Products, DataPackages, Orders, Settings
  context/        - AuthContext, CartContext
  lib/            - supabase.js, paystack.js, helpers.js
  hooks/          - Custom React hooks
```

## Admin Panel

Access at `/admin` after logging in with an admin account.

Features:
- Dashboard with stats and recent orders
- User management (create, edit role, delete)
- Category management (creates dynamic storefront pages)
- Product management with image/file upload to Supabase Storage
- Data package management by network
- Order management with status updates
- Store settings

## Paystack Integration

Payments are processed in Ghana Cedis (GHS). The checkout flow:
1. User fills contact info
2. Clicks "Pay with Paystack"
3. Paystack popup opens
4. On success, order is saved to Supabase with `status: 'paid'`
5. User redirected to order confirmation page

## License

MIT
