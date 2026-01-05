import { supabase } from "@/lib/supabase";
import type {
  BookingSettings,
  Dentist,
  Service,
  ScheduleBooking,
  ManageRow,
} from "@/types";

export type PatientLite = {
  id: string;
  hn: string;
  name_th: string | null;
  name_en: string | null;
  phone: string | null;
};

export async function getDentists(): Promise<Dentist[]> {
  const { data, error } = await supabase
    .from("dentists")
    .select("id,dentist_id,name,phone,is_active")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id,name_th,is_active")
    .eq("is_active", true)
    .order("name_th");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSettings(): Promise<BookingSettings> {
  const { data, error } = await supabase
    .from("booking_settings")
    .select("id,slot_capacity_per_dentist,slot_capacity_unassigned,updated_at")
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function searchPatients(
  query: string,
  limit = 20,
  offset = 0
): Promise<PatientLite[]> {
  const { data, error } = await supabase.rpc("search_patients", {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as PatientLite[];
}

export type CreateBookingInput = {
  patient_id?: string | null;
  walkin_name_th?: string | null;
  walkin_name_en?: string | null;
  walkin_phone?: string | null;
  dentist_id?: string | null;
  booking_date: string;
  booking_time: string;
  service_ids: string[];
  other_services: string[] | null;
  note?: string | null;
};

export async function createBooking(
  input: CreateBookingInput
): Promise<string> {
  const { data, error } = await supabase.rpc("create_booking_with_services", {
    p_patient_id: input.patient_id ?? null,
    p_walkin_name_th: input.walkin_name_th ?? null,
    p_walkin_name_en: input.walkin_name_en ?? null,
    p_walkin_phone: input.walkin_phone ?? null,
    p_dentist_id: input.dentist_id ?? null,
    p_booking_date: input.booking_date,
    p_booking_time: input.booking_time,
    p_service_ids: input.service_ids ?? [],
    p_other_services: input.other_services ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export type UpdateBookingInput = {
  booking_id: string;
  dentist_id?: string | null;
  booking_date: string;
  booking_time: string;
  service_ids: string[];
  other_services: string[] | null;
  note?: string | null;
};

export async function updateBooking(
  input: UpdateBookingInput
): Promise<string> {
  const { data, error } = await supabase.rpc("update_booking_with_services", {
    p_booking_id: input.booking_id,
    p_dentist_id: input.dentist_id ?? null,
    p_booking_date: input.booking_date,
    p_booking_time: input.booking_time,
    p_service_ids: input.service_ids ?? [],
    p_other_services: input.other_services ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function cancelBooking(booking_id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_booking", {
    p_booking_id: booking_id,
  });
  if (error) throw new Error(error.message);
}

export async function softDeleteBooking(booking_id: string): Promise<void> {
  const { error } = await supabase.rpc("soft_delete_booking", {
    p_booking_id: booking_id,
  });
  if (error) throw new Error(error.message);
}

export async function scheduleList(
  dateFrom: string,
  dateTo: string
): Promise<ScheduleBooking[]> {
  const { data, error } = await supabase.rpc("schedule_list_bookings", {
    p_date_from: dateFrom,
    p_date_to: dateTo,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as ScheduleBooking[];
}

export type ManageQuery = {
  dateFrom: string;
  dateTo: string;
  dentistId?: string | null;
  status?: "all" | "booked" | "cancelled";
  q?: string;
  includeDeleted?: boolean;
  page: number;
  pageSize: number;
};

export async function manageList(
  params: ManageQuery
): Promise<{ rows: ManageRow[]; total: number }> {
  const {
    dateFrom,
    dateTo,
    dentistId,
    status,
    q,
    includeDeleted,
    page,
    pageSize,
  } = params;
  let query = supabase
    .from("bookings")
    .select(
      `
      id, booking_date, booking_time, status, is_deleted, hn,
      walkin_name_th, walkin_name_en, walkin_phone, note, other_services, dentist_id,
      dentists ( name ),
      patient:patients ( name_th, name_en ),
      booking_services ( service_id, services ( name_th ) )
    `,
      { count: "exact" }
    )
    .gte("booking_date", dateFrom)
    .lte("booking_date", dateTo)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (!includeDeleted) query = query.eq("is_deleted", false);
  if (dentistId) query = query.eq("dentist_id", dentistId);
  if (status && status !== "all") query = query.eq("status", status);

  if (q && q.trim().length >= 2) {
    const term = q.trim().toLowerCase();
    query = query.or(
      [
        `hn.ilike.%${term}%`,
        `walkin_name_th.ilike.%${term}%`,
        `walkin_name_en.ilike.%${term}%`,
        `patients.search_text.ilike.%${term}%`,
      ].join(",")
    );
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as unknown as ManageRow[], total: count ?? 0 };
}

export type SummaryQuery = {
  dateFrom: string;
  dateTo: string;
  dentistId?: string | null;
  includeCancelled?: boolean;
  includeUnassigned?: boolean;
};
export async function summaryList(params: SummaryQuery): Promise<ManageRow[]> {
  const { dateFrom, dateTo, dentistId, includeCancelled, includeUnassigned } =
    params;

  let query = supabase
    .from("bookings")
    .select(
      `
      id, booking_date, booking_time, status, is_deleted, hn,
      walkin_name_th, walkin_name_en, walkin_phone, note, other_services, dentist_id,
      dentists ( name ),
      patient:patients ( name_th, name_en ),
      booking_services ( service_id, services ( name_th ) )
    `
    )
    .gte("booking_date", dateFrom)
    .lte("booking_date", dateTo)
    .eq("is_deleted", false)
    .order("booking_date", { ascending: true })
    .order("booking_time", { ascending: true });

  if (!includeCancelled) query = query.eq("status", "booked");

  if (dentistId) {
    query = includeUnassigned
      ? query.or(`dentist_id.eq.${dentistId},dentist_id.is.null`)
      : query.eq("dentist_id", dentistId);
  } else {
    if (includeUnassigned === false)
      query = query.not("dentist_id", "is", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ManageRow[];
}
