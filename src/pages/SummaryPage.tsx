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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getDentists, summaryList } from "@/lib/api";
import { dbTimeToHHmm, toISODate } from "@/lib/time";
import type { ManageRow } from "@/types";

function rowPatientLabel(r: ManageRow) {
  if (r.hn) {
    const name = r.patient?.name_th || r.patient?.name_en || "";
    return `${r.hn} ${name}`.trim();
  }
  return `No HN - ${(r.walkin_name_th || r.walkin_name_en || "").trim()}`;
}
function rowDentistLabel(r: ManageRow) {
  return r.dentists?.name ?? "Unassigned";
}
function serviceNames(r: ManageRow) {
  return (r.booking_services ?? [])
    .map((bs) => bs.services?.name_th)
    .filter(Boolean) as string[];
}

type GroupMode = "date" | "dentist";

export function SummaryPage() {
  const today = useMemo(() => toISODate(new Date()), []);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [dentistId, setDentistId] = useState<string>("");
  const [includeCancelled, setIncludeCancelled] = useState(false);
  const [includeUnassigned, setIncludeUnassigned] = useState(true);
  const [groupMode, setGroupMode] = useState<GroupMode>("date");

  const { data: dentists = [] } = useQuery({
    queryKey: ["dentists"],
    queryFn: getDentists,
  });

  const {
    data: rows = [],
    error,
    isFetching,
  } = useQuery({
    queryKey: [
      "summary",
      { dateFrom, dateTo, dentistId, includeCancelled, includeUnassigned },
    ],
    queryFn: () =>
      summaryList({
        dateFrom,
        dateTo,
        dentistId: dentistId || null,
        includeCancelled,
        includeUnassigned,
      }),
    enabled: Boolean(dateFrom && dateTo),
  });

  const grouped = useMemo(() => {
    const m = new Map<string, ManageRow[]>();
    for (const r of rows) {
      const key = groupMode === "date" ? r.booking_date : rowDentistLabel(r);
      const arr = m.get(key) ?? [];
      arr.push(r);
      m.set(key, arr);
    }
    const keys = Array.from(m.keys()).sort();
    return keys.map((k) => ({ key: k, rows: m.get(k)! }));
  }, [rows, groupMode]);

  return (
    <div className="space-y-4">
      <Section
        title="Summary (printable)"
        right={
          <Button className="no-print" onClick={() => window.print()}>
            Print
          </Button>
        }
      >
        <InlineError message={error instanceof Error ? error.message : null} />

        <div className="no-print grid gap-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Date from</Label>
            <Input
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date to</Label>
            <Input value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Dentist filter</Label>
            <Select value={dentistId} onValueChange={setDentistId}>
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
            <Label>Group mode</Label>
            <Select
              value={groupMode}
              onValueChange={(v) => setGroupMode(v as GroupMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Group by date</SelectItem>
                <SelectItem value="dentist">Group by dentist</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex flex-col gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <Checkbox
                  checked={includeCancelled}
                  onCheckedChange={(v) => setIncludeCancelled(Boolean(v))}
                />
                Include cancelled
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <Checkbox
                  checked={includeUnassigned}
                  onCheckedChange={(v) => setIncludeUnassigned(Boolean(v))}
                />
                Include unassigned
              </label>
            </div>
          </div>
        </div>

        <div className="no-print mt-4 text-sm text-zinc-600">
          {isFetching ? "Loading..." : `Rows: ${rows.length}`}
        </div>

        <div className="mt-6 space-y-6">
          {grouped.map((g) => (
            <div key={g.key} className="break-inside-avoid">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-semibold">{g.key}</div>
                <div className="text-sm text-zinc-500">
                  {g.rows.length} bookings
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-zinc-200">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50">
                    <tr className="border-b border-zinc-200">
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Patient</th>
                      <th className="px-3 py-2 text-left">Dentist</th>
                      <th className="px-3 py-2 text-left">Services</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r.id} className="border-b border-zinc-100">
                        <td className="px-3 py-2 whitespace-nowrap">
                          {dbTimeToHHmm(r.booking_time)}
                        </td>
                        <td className="px-3 py-2">{rowPatientLabel(r)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {rowDentistLabel(r)}
                        </td>
                        <td className="px-3 py-2">
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
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.status === "cancelled" ? (
                            <Badge variant="destructive">Cancelled</Badge>
                          ) : (
                            <Badge>Booked</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                    {g.rows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-3 py-6 text-center text-zinc-500"
                        >
                          No data
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          {grouped.length === 0 && (
            <div className="text-sm text-zinc-500">No data</div>
          )}
        </div>

        <style>{`
          @media print {
            .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
            table { page-break-inside: avoid; }
          }
        `}</style>
      </Section>
    </div>
  );
}
