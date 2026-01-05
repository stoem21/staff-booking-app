import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Section } from "@/components/Section";
import { InlineError } from "@/components/InlineError";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

import {
  PatientCombobox,
  type PatientPick,
} from "@/components/PatientCombobox";
import { ServicesMultiSelect } from "@/components/ServicesMultiSelect";
import { MultiDayTimetable } from "@/components/MultiDayTimetable";
import { BookingEditSheet } from "@/components/BookingEditSheet";

import {
  createBooking,
  getDentists,
  getServices,
  getSettings,
  scheduleList,
} from "@/lib/api";
import { timeSlots, timeToDb, toISODate } from "@/lib/time";
import type { ScheduleBooking } from "@/types";

export function BookPage() {
  const qc = useQueryClient();
  const today = useMemo(() => toISODate(new Date()), []);
  const [primaryDate, setPrimaryDate] = useState(today);
  const [days, setDays] = useState<string[]>([today]);

  React.useEffect(
    () =>
      setDays((prev) => {
        const c = [...prev];
        c[0] = primaryDate;
        return c;
      }),
    [primaryDate]
  );

  const { data: dentists = [] } = useQuery({
    queryKey: ["dentists"],
    queryFn: getDentists,
  });
  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: getServices,
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const dateFrom = useMemo(() => [...days].sort()[0], [days]);
  const dateTo = useMemo(() => [...days].sort().slice(-1)[0], [days]);

  const { data: schedule = [], isFetching: scheduleLoading } = useQuery({
    queryKey: ["schedule", dateFrom, dateTo],
    queryFn: () => scheduleList(dateFrom, dateTo),
    enabled: Boolean(settings),
  });

  // form state
  const [tab, setTab] = useState<"existing" | "walkin">("existing");
  const [patient, setPatient] = useState<PatientPick>(null);

  const [walkinNameTh, setWalkinNameTh] = useState("");
  const [walkinNameEn, setWalkinNameEn] = useState("");
  const [walkinPhone, setWalkinPhone] = useState("");

  const [dentistId, setDentistId] = useState<string>("");
  const [time, setTime] = useState<string>(timeSlots()[0]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [otherServices, setOtherServices] = useState<string[]>([]);
  const [otherInput, setOtherInput] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): string | null {
    if (tab === "existing" && !patient)
      return "Please select an existing patient.";
    if (tab === "walkin" && !(walkinNameTh.trim() || walkinNameEn.trim()))
      return "Walk-in: require name_th or name_en.";
    const hasServices =
      serviceIds.length > 0 ||
      otherServices.map((x) => x.trim()).filter(Boolean).length > 0;
    if (!hasServices)
      return "Please select at least one DB service OR add other service.";
    if (!primaryDate || !time) return "Please select date/time.";
    return null;
  }

  const createMut = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const e = validate();
      if (e) throw new Error(e);

      return createBooking({
        patient_id: tab === "existing" ? patient!.id : null,
        walkin_name_th: tab === "walkin" ? walkinNameTh.trim() || null : null,
        walkin_name_en: tab === "walkin" ? walkinNameEn.trim() || null : null,
        walkin_phone: tab === "walkin" ? walkinPhone.trim() || null : null,
        dentist_id: dentistId ? dentistId : null,
        booking_date: primaryDate,
        booking_time: timeToDb(time),
        service_ids: serviceIds,
        other_services: otherServices.map((x) => x.trim()).filter(Boolean)
          .length
          ? otherServices.map((x) => x.trim()).filter(Boolean)
          : null,
        note: note.trim() || null,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["schedule"] });
      await qc.invalidateQueries({ queryKey: ["manage"] });
      setServiceIds([]);
      setOtherServices([]);
      setOtherInput("");
      setNote("");
      if (tab === "existing") setPatient(null);
      else {
        setWalkinNameTh("");
        setWalkinNameEn("");
        setWalkinPhone("");
      }
    },
    onError: (e) =>
      setFormError(e instanceof Error ? e.message : "Create booking failed"),
  });

  // edit sheet
  const [editOpen, setEditOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] =
    useState<ScheduleBooking | null>(null);
  function onOpenBooking(b: ScheduleBooking) {
    setSelectedBooking(b);
    setEditOpen(true);
  }

  if (!settings) return <div className="p-6">Loading settings...</div>;

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <div className="space-y-4">
        <Section title="Create booking">
          <InlineError message={formError} />

          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                  >
                    <span>{primaryDate}</span>
                    <span className="text-xs text-zinc-500">Asia/Bangkok</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto">
                  <Calendar
                    mode="single"
                    selected={new Date(primaryDate)}
                    onSelect={(d) => {
                      if (!d) return;
                      setPrimaryDate(toISODate(d));
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Time (10:00–19:00, 15 min)</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {timeSlots().map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <Label>Patient</Label>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="existing" className="flex-1">
                    Existing patient
                  </TabsTrigger>
                  <TabsTrigger value="walkin" className="flex-1">
                    Walk-in
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="existing">
                  <div className="space-y-2">
                    <PatientCombobox value={patient} onChange={setPatient} />
                    <div className="text-xs text-zinc-500">
                      Search by HN / Thai / English name. Debounce 400ms. Page
                      size 20.
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="walkin">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Walk-in name (TH) *</Label>
                        <Input
                          value={walkinNameTh}
                          onChange={(e) => setWalkinNameTh(e.target.value)}
                          placeholder="ชื่อภาษาไทย"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Walk-in name (EN) *</Label>
                        <Input
                          value={walkinNameEn}
                          onChange={(e) => setWalkinNameEn(e.target.value)}
                          placeholder="English name"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (optional)</Label>
                      <Input
                        value={walkinPhone}
                        onChange={(e) => setWalkinPhone(e.target.value)}
                        placeholder="0xxxxxxxxx"
                      />
                    </div>
                    <div className="text-xs text-zinc-500">
                      Walk-in stores patient_id=NULL, hn=NULL (no patient
                      creation).
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Services (from DB)</Label>
              <ServicesMultiSelect
                services={services}
                value={serviceIds}
                onChange={setServiceIds}
              />
            </div>

            <div className="space-y-2">
              <Label>Other custom services</Label>
              <div className="flex gap-2">
                <Input
                  value={otherInput}
                  onChange={(e) => setOtherInput(e.target.value)}
                  placeholder="Type and press Enter"
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
                    <Badge key={s} variant="outline" className="gap-1">
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
              <Label>Note (optional)</Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note..."
              />
            </div>

            <Button
              onClick={() => createMut.mutate()}
              disabled={createMut.isPending}
              className="w-full"
            >
              {createMut.isPending ? "Creating..." : "Create booking"}
            </Button>
          </div>
        </Section>

        <Section title="Quick info">
          <div className="text-sm text-zinc-700 space-y-1">
            <div>
              Slot length: <span className="font-medium">15 minutes</span>
            </div>
            <div>
              Capacity per dentist:{" "}
              <span className="font-medium">
                {settings.slot_capacity_per_dentist}
              </span>
            </div>
            <div>
              Capacity unassigned:{" "}
              <span className="font-medium">
                {settings.slot_capacity_unassigned}
              </span>
            </div>
          </div>
        </Section>
      </div>

      <div className="space-y-4">
        <Section
          title="Multi-day timetable"
          right={
            <div className="text-sm text-zinc-500">
              {scheduleLoading ? "Loading..." : `${schedule.length} bookings`}
            </div>
          }
        >
          <MultiDayTimetable
            days={days}
            onChangeDays={setDays}
            dentists={dentists}
            settings={settings}
            bookings={schedule}
            onOpenBooking={onOpenBooking}
          />
        </Section>
      </div>

      <BookingEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={selectedBooking}
        dentists={dentists}
        services={services}
      />
    </div>
  );
}
