import React, { useMemo, useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { InlineError } from "@/components/InlineError";
import { ServicesMultiSelect } from "@/components/ServicesMultiSelect";
import { dbTimeToHHmm, timeSlots, timeToDb } from "@/lib/time";
import type { Dentist, Service, ScheduleBooking } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelBooking, softDeleteBooking, updateBooking } from "@/lib/api";

export function BookingEditSheet({
  open,
  onOpenChange,
  booking,
  dentists,
  services,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  booking: ScheduleBooking | null;
  dentists: Dentist[];
  services: Service[];
}) {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const initial = useMemo(() => {
    if (!booking) return null;
    return {
      dentist_id: booking.dentist_id ?? "",
      booking_date: booking.booking_date,
      booking_time: dbTimeToHHmm(booking.booking_time),
      service_ids: booking.service_ids ?? [],
      other_services: booking.other_services ?? [],
      note: booking.note ?? "",
    };
  }, [booking]);

  const [dentistId, setDentistId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [otherServices, setOtherServices] = useState<string[]>([]);
  const [otherInput, setOtherInput] = useState("");
  const [note, setNote] = useState("");

  React.useEffect(() => {
    setError(null);
    if (!initial) return;
    setDentistId(initial.dentist_id);
    setDate(initial.booking_date);
    setTime(initial.booking_time);
    setServiceIds(initial.service_ids);
    setOtherServices(initial.other_services);
    setOtherInput("");
    setNote(initial.note);
  }, [initial, open]);

  const mutUpdate = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");
      setError(null);
      const normOther = otherServices.map((s) => s.trim()).filter(Boolean);
      return updateBooking({
        booking_id: booking.id,
        dentist_id: dentistId ? dentistId : null,
        booking_date: date,
        booking_time: timeToDb(time),
        service_ids: serviceIds,
        other_services: normOther.length ? normOther : null,
        note: note.trim() || null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      await qc.invalidateQueries({ queryKey: ["manage"] });
      onOpenChange(false);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Update failed"),
  });

  const mutCancel = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");
      setError(null);
      await cancelBooking(booking.id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      await qc.invalidateQueries({ queryKey: ["manage"] });
      onOpenChange(false);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Cancel failed"),
  });

  const mutDelete = useMutation({
    mutationFn: async () => {
      if (!booking) throw new Error("No booking selected");
      setError(null);
      await softDeleteBooking(booking.id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      await qc.invalidateQueries({ queryKey: ["manage"] });
      onOpenChange(false);
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Delete failed"),
  });

  if (!booking) return null;

  const patientLabel = booking.patient_id
    ? `${booking.hn ?? ""} ${(
        booking.patient_name_th ??
        booking.patient_name_en ??
        ""
      ).trim()}`.trim()
    : `No HN - ${(
        booking.walkin_name_th ??
        booking.walkin_name_en ??
        ""
      ).trim()}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="space-y-4">
        <div className="pr-10">
          <div className="text-lg font-semibold">Edit booking</div>
          <div className="mt-1 text-sm text-zinc-600">{patientLabel}</div>
          {booking.status === "cancelled" && (
            <div className="mt-2">
              <Badge variant="destructive">Cancelled</Badge>
            </div>
          )}
        </div>

        <InlineError message={error} />

        <div className="space-y-2">
          <Label>Dentist (optional)</Label>
          <Select value={dentistId} onValueChange={setDentistId}>
            <SelectTrigger>
              <SelectValue placeholder="Unassigned dentist" />
            </SelectTrigger>
            <SelectContent>
              {/* <SelectItem value="">Unassigned</SelectItem> */}
              {dentists.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="YYYY-MM-DD"
            />
          </div>
          <div className="space-y-2">
            <Label>Time</Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots().map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Services (DB)</Label>
          <ServicesMultiSelect
            services={services}
            value={serviceIds}
            onChange={setServiceIds}
          />
        </div>

        <div className="space-y-2">
          <Label>Other services (custom)</Label>
          <div className="flex gap-2">
            <Input
              value={otherInput}
              onChange={(e) => setOtherInput(e.target.value)}
              placeholder="Type and add"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = otherInput.trim();
                  if (!v) return;
                  if (
                    !otherServices
                      .map((x) => x.toLowerCase())
                      .includes(v.toLowerCase())
                  )
                    setOtherServices([...otherServices, v]);
                  setOtherInput("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const v = otherInput.trim();
                if (!v) return;
                if (
                  !otherServices
                    .map((x) => x.toLowerCase())
                    .includes(v.toLowerCase())
                )
                  setOtherServices([...otherServices, v]);
                setOtherInput("");
              }}
            >
              Add
            </Button>
          </div>

          {otherServices.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {otherServices.map((s) => (
                <Badge key={s} className="gap-1">
                  {s}
                  <button
                    type="button"
                    className="ml-1 rounded-full px-1 hover:bg-zinc-200"
                    onClick={() =>
                      setOtherServices(otherServices.filter((x) => x !== s))
                    }
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Note</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note..."
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            onClick={() => mutUpdate.mutate()}
            disabled={mutUpdate.isPending}
          >
            {mutUpdate.isPending ? "Saving..." : "Update"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => mutCancel.mutate()}
            disabled={mutCancel.isPending || booking.status === "cancelled"}
          >
            {mutCancel.isPending ? "Cancelling..." : "Cancel"}
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutDelete.mutate()}
            disabled={mutDelete.isPending}
          >
            {mutDelete.isPending ? "Deleting..." : "Delete (soft)"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
