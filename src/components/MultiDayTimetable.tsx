import React, { useMemo, useState } from "react";
import type { BookingSettings, Dentist, ScheduleBooking } from "@/types";
import { dbTimeToHHmm, timeSlots } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type Props = {
  days: string[]; // yyyy-mm-dd (day 1 locked)
  onChangeDays: (days: string[]) => void;
  dentists: Dentist[];
  settings: BookingSettings;
  bookings: ScheduleBooking[];
  onOpenBooking: (b: ScheduleBooking) => void;
};

export function MultiDayTimetable({
  days,
  onChangeDays,
  dentists,
  settings,
  bookings,
  onOpenBooking,
}: Props) {
  const slots = useMemo(() => timeSlots(), []);
  const [dentistFilter, setDentistFilter] = useState<string>("");
  const [includeUnassigned, setIncludeUnassigned] = useState<boolean>(true);

  const activeDentistCount = dentists.length;
  const totalCapacity =
    activeDentistCount * settings.slot_capacity_per_dentist +
    settings.slot_capacity_unassigned;

  const bookingsByDayTime = useMemo(() => {
    const map = new Map<string, ScheduleBooking[]>();
    for (const b of bookings) {
      const key = `${b.booking_date}|${dbTimeToHHmm(b.booking_time)}`;
      const arr = map.get(key) ?? [];
      arr.push(b);
      map.set(key, arr);
    }
    return map;
  }, [bookings]);

  function cellBookings(day: string, time: string): ScheduleBooking[] {
    const arr = bookingsByDayTime.get(`${day}|${time}`) ?? [];
    if (!dentistFilter) return arr;
    return includeUnassigned
      ? arr.filter(
          (b) => b.dentist_id === dentistFilter || b.dentist_id === null
        )
      : arr.filter((b) => b.dentist_id === dentistFilter);
  }

  function counts(day: string, time: string) {
    const arr = bookingsByDayTime.get(`${day}|${time}`) ?? [];
    const notCancelled = arr.filter(
      (b) => b.status !== "cancelled" && !b.is_deleted
    );
    if (!dentistFilter)
      return {
        mode: "aggregate" as const,
        booked: notCancelled.length,
        cap: totalCapacity,
      };

    const dentistBooked = notCancelled.filter(
      (b) => b.dentist_id === dentistFilter
    ).length;
    const unassignedBooked = notCancelled.filter(
      (b) => b.dentist_id === null
    ).length;

    return includeUnassigned
      ? {
          mode: "both" as const,
          dentistBooked,
          dentistCap: settings.slot_capacity_per_dentist,
          unassignedBooked,
          unassignedCap: settings.slot_capacity_unassigned,
        }
      : {
          mode: "dentist" as const,
          dentistBooked,
          dentistCap: settings.slot_capacity_per_dentist,
        };
  }

  function addDay() {
    const last = days[days.length - 1];
    onChangeDays([...days, last]);
  }

  function removeDay(idx: number) {
    if (idx === 0) return;
    onChangeDays(days.filter((_, i) => i !== idx));
  }

  function updateDay(idx: number, value: string) {
    const copy = [...days];
    copy[idx] = value;
    onChangeDays(copy);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">Dentist filter</div>
          <div className="w-[260px]">
            <Select value={dentistFilter} onValueChange={setDentistFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All dentists" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="">All dentists</SelectItem> */}
                {dentists.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Checkbox
              checked={includeUnassigned}
              onCheckedChange={(v) => setIncludeUnassigned(Boolean(v))}
            />
            Include unassigned
          </label>
        </div>

        <Button type="button" variant="secondary" onClick={addDay}>
          + Add day column
        </Button>
      </div>

      <div className="overflow-auto rounded-2xl border border-zinc-200 bg-white">
        <div className="min-w-[900px]">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `120px repeat(${days.length}, minmax(240px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 border-b border-zinc-200 bg-white px-3 py-2 text-sm font-semibold">
              Time
            </div>
            {days.map((d, idx) => (
              <div
                key={`${d}-${idx}`}
                className="border-b border-zinc-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <input
                    className={cn(
                      "h-9 w-full rounded-xl border border-zinc-200 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400",
                      idx === 0 ? "bg-zinc-50" : "bg-white"
                    )}
                    value={d}
                    onChange={(e) => updateDay(idx, e.target.value)}
                    disabled={idx === 0}
                  />
                  {idx !== 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDay(idx)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {idx === 0 ? "Day 1 (locked)" : "Extra day"}
                </div>
              </div>
            ))}

            {slots.map((t) => (
              <React.Fragment key={t}>
                <div className="sticky left-0 z-10 border-b border-zinc-100 bg-white px-3 py-2 text-sm text-zinc-700">
                  {t}
                </div>

                {days.map((d, idx) => {
                  const list = cellBookings(d, t);
                  const c: any = counts(d, t);

                  return (
                    <div
                      key={`${d}-${t}-${idx}`}
                      className="border-b border-zinc-100 px-3 py-2"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        {c.mode === "aggregate" ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">{c.booked}</span> /{" "}
                            {c.cap} capacity
                          </div>
                        ) : c.mode === "dentist" ? (
                          <div className="text-xs text-zinc-600">
                            <span className="font-medium">
                              {c.dentistBooked}
                            </span>{" "}
                            / {c.dentistCap} capacity
                          </div>
                        ) : (
                          <div className="text-xs text-zinc-600 space-y-0.5">
                            <div>
                              Dentist:{" "}
                              <span className="font-medium">
                                {c.dentistBooked}
                              </span>{" "}
                              / {c.dentistCap}
                            </div>
                            <div>
                              Unassigned:{" "}
                              <span className="font-medium">
                                {c.unassignedBooked}
                              </span>{" "}
                              / {c.unassignedCap}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-zinc-400">
                          {list.length ? `${list.length} item(s)` : ""}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {list.map((b) => {
                          const isCancelled = b.status === "cancelled";
                          const patientLabel = b.patient_id
                            ? `${b.hn ?? ""} ${(
                                b.patient_name_th ??
                                b.patient_name_en ??
                                ""
                              ).trim()}`.trim()
                            : `No HN - ${(
                                b.walkin_name_th ??
                                b.walkin_name_en ??
                                ""
                              ).trim()}`;
                          const dentistLabel = b.dentist_name ?? "Unassigned";

                          return (
                            <button
                              type="button"
                              key={b.id}
                              onClick={() => onOpenBooking(b)}
                              className={cn(
                                "w-full rounded-xl border border-zinc-200 bg-white px-2 py-2 text-left shadow-sm hover:bg-zinc-50",
                                isCancelled && "opacity-70"
                              )}
                            >
                              <div
                                className={cn(
                                  "text-sm font-medium",
                                  isCancelled && "line-through"
                                )}
                              >
                                {patientLabel}
                              </div>
                              <div className="mt-0.5 text-xs text-zinc-600">
                                Dentist: {dentistLabel}
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {b.service_names?.map((s) => (
                                  <Badge key={s}>{s}</Badge>
                                ))}
                                {(b.other_services ?? []).map((s) => (
                                  <Badge key={`o-${s}`} variant="outline">
                                    {s}
                                  </Badge>
                                ))}
                                {isCancelled && (
                                  <Badge variant="destructive">Cancelled</Badge>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="text-xs text-zinc-500">
        Capacity excludes cancelled+deleted. Aggregate capacity (no dentist
        filter) = activeDentists × perDentistCapacity + unassignedCapacity.
      </div>
    </div>
  );
}
