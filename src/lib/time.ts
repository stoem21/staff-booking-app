import { addMinutes, format, parse } from "date-fns";

export function toISODate(d: Date): string { return format(d, "yyyy-MM-dd"); }

export function timeSlots(): string[] {
  const slots: string[] = [];
  let t = parse("10:00", "HH:mm", new Date());
  const end = parse("18:45", "HH:mm", new Date());
  while (t <= end) { slots.push(format(t, "HH:mm")); t = addMinutes(t, 15); }
  return slots;
}

export function timeToDb(hhmm: string): string { return `${hhmm}:00`; }
export function dbTimeToHHmm(t: string): string { return t.slice(0, 5); }
