import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@/components/Section";
import { InlineError } from "@/components/InlineError";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
  getDentists,
  getServices,
  getSettings,
  manageList,
  scheduleList,
} from "@/lib/api";
import { dbTimeToHHmm, toISODate } from "@/lib/time";
import type { ManageRow, ScheduleBooking } from "@/types";
import { BookingEditSheet } from "@/components/BookingEditSheet";

function rowPatientLabel(r: ManageRow) {
  if (r.hn) {
    const name = r.patient?.name_th || r.patient?.name_en || "";
    return `${r.hn} ${name}`.trim();
  }
  return `No HN - ${(r.walkin_name_th || r.walkin_name_en || "").trim()}`;
}

function serviceNames(r: ManageRow) {
  return (r.booking_services ?? [])
    .map((bs) => bs.services?.name_th)
    .filter(Boolean) as string[];
}

export function ManagePage() {
  const today = useMemo(() => toISODate(new Date()), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [dentistId, setDentistId] = useState<string>("");
  const [status, setStatus] = useState<"all" | "booked" | "cancelled">("all");
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

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

  const { data, isFetching, error } = useQuery({
    queryKey: [
      "manage",
      {
        dateFrom,
        dateTo,
        dentistId,
        status,
        q,
        includeDeleted,
        page,
        pageSize,
      },
    ],
    queryFn: () =>
      manageList({
        dateFrom,
        dateTo,
        dentistId: dentistId || null,
        status,
        q,
        includeDeleted,
        page,
        pageSize,
      }),
    enabled: Boolean(dateFrom && dateTo),
  });

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const maxPage = Math.max(0, Math.ceil(total / pageSize) - 1);

  const { data: rangeBookings = [] } = useQuery({
    queryKey: ["schedule", dateFrom, dateTo],
    queryFn: () => scheduleList(dateFrom, dateTo),
    enabled: Boolean(dateFrom && dateTo),
  });

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ScheduleBooking | null>(null);
  function openEdit(id: string) {
    const b = rangeBookings.find((x) => x.id === id) ?? null;
    setSelected(b);
    setEditOpen(true);
  }

  return (
    <div className="space-y-4">
      <Section title="Manage bookings">
        <InlineError message={error instanceof Error ? error.message : null} />

        <div className="grid gap-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Date from</Label>
            <Input
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Date to</Label>
            <Input
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Patient search ({">"}=2 chars)</Label>
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="HN / Thai / English / walk-in"
            />
          </div>
          <div className="space-y-2">
            <Label>Dentist</Label>
            <Select
              value={dentistId}
              onValueChange={(v) => {
                setDentistId(v);
                setPage(0);
              }}
            >
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
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as any);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <Checkbox
              checked={includeDeleted}
              onCheckedChange={(v) => {
                setIncludeDeleted(Boolean(v));
                setPage(0);
              }}
            />
            Include deleted
          </label>
          <div className="text-sm text-zinc-600">
            {isFetching ? "Loading..." : `Total: ${total}`}
          </div>
        </div>

        <div className="mt-4 overflow-auto rounded-2xl border border-zinc-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Dentist</TableHead>
                <TableHead>Services</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">
                    {r.booking_date}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {dbTimeToHHmm(r.booking_time)}
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    {rowPatientLabel(r)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.dentists?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="min-w-[260px]">
                    <div className="flex flex-wrap gap-1.5">
                      {serviceNames(r).map((n) => (
                        <Badge key={n}>{n}</Badge>
                      ))}
                      {(r.other_services ?? []).map((n) => (
                        <Badge key={`o-${n}`} variant="outline">
                          {n}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.is_deleted ? (
                      <Badge variant="destructive">Deleted</Badge>
                    ) : r.status === "cancelled" ? (
                      <Badge variant="destructive">Cancelled</Badge>
                    ) : (
                      <Badge>Booked</Badge>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(r.id)}
                      disabled={!settings}
                    >
                      Edit / Cancel / Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-8 text-center text-sm text-zinc-500"
                  >
                    No results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="text-sm text-zinc-600">
            Page {page + 1} / {maxPage + 1}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={page >= maxPage}
              onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Section>

      <BookingEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        booking={selected}
        dentists={dentists}
        services={services}
      />
    </div>
  );
}
