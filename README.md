# Staff Booking App (React + Supabase-only Backend)

## What you get

- /login (Supabase Auth)
- /book (create booking + multi-day timetable view)
- /manage (edit/cancel/delete + server-side pagination)
- /summary (grouped printable summary + window.print)

## Important

This repo assumes you have already run **schema.sql** (tables + RLS + RPC).
Your frontend calls these RPCs:

- search_patients
- create_booking_with_services
- update_booking_with_services
- cancel_booking
- soft_delete_booking
- schedule_list_bookings

## Setup steps

### 1) Supabase

1. Create a Supabase project
2. Enable Email/Password auth
3. Run `supabase/schema.sql` in SQL editor
4. Create staff auth user(s) in Dashboard
5. Insert their `auth.users.id` into `public.staff_users`

### 2) Frontend

```bash
npm install
cp .env.example .env
# set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

### 3) Add shadcn/ui components (required for compile)

This template references `@/components/ui/*`. Generate them:

```bash
npx shadcn@latest init
npx shadcn@latest add button input label textarea tabs sheet select popover badge table checkbox command calendar
```

If you already use shadcn, just ensure these components exist under `src/components/ui/`.
