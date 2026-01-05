import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchPatients, type PatientLite } from "@/lib/api";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export type PatientPick = PatientLite | null;

export function PatientCombobox({ value, onChange }: { value: PatientPick; onChange: (p: PatientPick) => void; }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const debounced = useDebounced(q, 400);
  const [offset, setOffset] = useState(0);

  useEffect(() => setOffset(0), [debounced]);

  const enabled = debounced.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["patients-search", debounced, offset],
    queryFn: () => searchPatients(debounced.trim(), 20, offset),
    enabled,
  });

  const items = data ?? [];

  const label = useMemo(() => {
    if (!value) return "Search HN / name...";
    const name = value.name_th || value.name_en || "";
    return `${value.hn} ${name}`.trim();
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-between">
          <span className="truncate">{label}</span>
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type >= 2 chars (HN / ไทย / English)"
            value={q}
            onValueChange={(v) => setQ(v)}
          />
          <CommandList>
            {!enabled && <CommandEmpty>Type at least 2 characters...</CommandEmpty>}
            {enabled && isFetching && <CommandEmpty>Searching...</CommandEmpty>}
            {enabled && !isFetching && items.length === 0 && <CommandEmpty>No results</CommandEmpty>}

            {enabled && items.length > 0 && (
              <CommandGroup>
                {items.map((p) => {
                  const name = p.name_th || p.name_en || "";
                  return (
                    <CommandItem
                      key={p.id}
                      value={`${p.hn} ${name}`}
                      onSelect={() => { onChange(p); setOpen(false); }}
                    >
                      <div className="flex w-full flex-col">
                        <div className="font-medium">{p.hn}</div>
                        <div className="text-xs text-zinc-600">{name}</div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {enabled && (
              <div className="flex items-center justify-between gap-2 border-t border-zinc-200 p-2">
                <Button type="button" variant="secondary" size="sm" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 20))}>Prev</Button>
                <div className="text-xs text-zinc-500">Page {Math.floor(offset / 20) + 1}</div>
                <Button type="button" variant="secondary" size="sm" disabled={items.length < 20} onClick={() => setOffset((o) => o + 20)}>Next</Button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
