export type Dentist = { id: string; dentist_id: string; name: string; phone: string | null; is_active: boolean; };
export type Service = { id: string; name_th: string; is_active: boolean; };
export type BookingSettings = { id: number; slot_capacity_per_dentist: number; slot_capacity_unassigned: number; updated_at: string; };

export type ScheduleBooking = {
  id: string;
  booking_date: string; booking_time: string;
  status: "booked" | "cancelled";
  is_deleted: boolean;
  patient_id: string | null;
  hn: string | null;
  patient_name_th: string | null; patient_name_en: string | null;
  walkin_name_th: string | null; walkin_name_en: string | null; walkin_phone: string | null;
  dentist_id: string | null; dentist_name: string | null; dentist_code: string | null;
  service_ids: string[]; service_names: string[];
  other_services: string[] | null;
  note: string | null;
};

export type ManageRow = {
  id: string;
  booking_date: string; booking_time: string;
  status: "booked" | "cancelled";
  is_deleted: boolean;
  hn: string | null;
  walkin_name_th: string | null; walkin_name_en: string | null; walkin_phone: string | null;
  note: string | null;
  other_services: string[] | null;
  dentist_id: string | null;
  dentists?: { name: string } | null;
  patient?: { name_th: string | null; name_en: string | null } | null;
  booking_services?: { service_id: string; services?: { name_th: string } | null }[];
};
