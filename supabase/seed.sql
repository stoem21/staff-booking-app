-- Seed SQL (safe)
-- 1) Run schema.sql first
-- 2) Run this seed.sql
-- 3) Create bookings via the UI (RPCs enforce auth context)
-- NOTE: If you want to seed bookings via SQL, your RPCs require an authenticated user context.
--       Easiest: seed only dentists/services/patients here.

insert into public.dentists (id, dentist_id, name, phone, is_active) values
  (gen_random_uuid(), 'D001', 'Dr. Ananda', '0811111111', true),
  (gen_random_uuid(), 'D002', 'Dr. Ploy',   '0822222222', true),
  (gen_random_uuid(), 'D003', 'Dr. Niran',  '0833333333', true)
on conflict (dentist_id) do nothing;

insert into public.services (id, name_th, is_active) values
  (gen_random_uuid(), 'ขูดหินปูน', true),
  (gen_random_uuid(), 'อุดฟัน', true),
  (gen_random_uuid(), 'ถอนฟัน', true),
  (gen_random_uuid(), 'จัดฟัน', true),
  (gen_random_uuid(), 'ฟอกสีฟัน', true)
on conflict (name_th) do nothing;

insert into public.patients (id, hn, name_th, name_en, phone) values
  (gen_random_uuid(), 'HN0001', 'สมชาย ใจดี', 'Somchai Jaidee', '0890000001'),
  (gen_random_uuid(), 'HN0002', 'สมหญิง ใจงาม', 'Somying Jaingam', '0890000002'),
  (gen_random_uuid(), 'HN0003', 'วิชัย สุขสันต์', 'Wichai Suksan', '0890000003'),
  (gen_random_uuid(), 'HN0004', 'อรทัย พรชัย', 'Orathai Pornchai', '0890000004'),
  (gen_random_uuid(), 'HN0005', 'กิตติพงศ์ แสงทอง', 'Kittipong Saengthong', '0890000005')
on conflict (hn) do nothing;

insert into public.booking_settings(id, slot_capacity_per_dentist, slot_capacity_unassigned)
values (1, 2, 2)
on conflict (id) do nothing;

-- After you create an auth user (staff), add them to staff_users:
-- insert into public.staff_users(user_id, role, is_active) values ('<AUTH_USER_UUID>', 'staff', true);
