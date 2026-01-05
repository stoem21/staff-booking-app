import React, { useMemo, useState } from "react";
import type { Service } from "@/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function ServicesMultiSelect({ services, value, onChange }: { services: Service[]; value: string[]; onChange: (ids: string[]) => void; }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? services.filter((s) => s.name_th.toLowerCase().includes(t)) : services;
  }, [services, q]);

  const selectedNames = useMemo(() => {
    const m = new Map(services.map((s) => [s.id, s.name_th]));
    return value.map((id) => m.get(id)).filter(Boolean) as string[];
  }, [services, value]);

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span className="truncate">{value.length ? `${value.length} selected` : "Select services..."}</span>
            <ChevronDown className="h-4 w-4 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search services..." value={q} onValueChange={setQ} />
            <CommandList>
              <CommandGroup>
                {filtered.map((s) => {
                  const selected = value.includes(s.id);
                  return (
                    <CommandItem key={s.id} value={s.name_th} onSelect={() => toggle(s.id)} className="flex items-center gap-2">
                      <span className={cn("flex h-4 w-4 items-center justify-center rounded border", selected ? "bg-zinc-900 text-white border-zinc-900" : "border-zinc-300")}>
                        {selected && <Check className="h-3 w-3" />}
                      </span>
                      <span>{s.name_th}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedNames.map((n) => <Badge key={n}>{n}</Badge>)}
        </div>
      )}
    </div>
  );
}
