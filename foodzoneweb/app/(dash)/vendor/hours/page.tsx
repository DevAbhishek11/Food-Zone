"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { OperatingHour, useUpdateHours, useVendorHours } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import { useState } from "react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function defaultWeek(existing: OperatingHour[]): OperatingHour[] {
  const byDay = new Map(existing.map((h) => [h.day_of_week, h]));
  return DAYS.map((_, day) => {
    const h = byDay.get(day);
    return {
      day_of_week: day,
      is_closed: h ? h.is_closed : day === 0,
      open_time: h?.open_time ? h.open_time.slice(0, 5) : "09:00",
      close_time: h?.close_time ? h.close_time.slice(0, 5) : "22:00",
    };
  });
}

export default function VendorHoursPage() {
  const { data, isLoading, isError, refetch } = useVendorHours();

  return (
    <>
      <PageHeader title="Operating Hours" subtitle="When your store accepts orders" />

      <div className="mx-auto w-full max-w-2xl space-y-2 p-4 md:p-6">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)
        ) : isError || !data ? (
          <ErrorState message="Couldn't load hours. Are you a vendor?" onRetry={() => refetch()} />
        ) : (
          // Re-mount when the server data identity changes so the editor re-seeds.
          <HoursEditor initial={data} />
        )}
      </div>
    </>
  );
}

function HoursEditor({ initial }: { initial: OperatingHour[] }) {
  const [week, setWeek] = useState<OperatingHour[]>(() => defaultWeek(initial));
  const update = useUpdateHours();

  const setDay = (day: number, patch: Partial<OperatingHour>) =>
    setWeek((w) => w.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)));

  const save = async () => {
    try {
      await update.mutateAsync(week);
      toast.success("Operating hours saved");
    } catch {
      toast.error("Could not save hours.");
    }
  };

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button size="sm" onClick={save} loading={update.isPending}>Save</Button>
      </div>
      {week.map((h) => (
        <div key={h.day_of_week} className="flex flex-wrap items-center gap-3 rounded-card border border-line bg-bg-soft p-3">
          <span className="w-24 text-sm font-medium">{DAYS[h.day_of_week]}</span>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={!h.is_closed}
              onChange={(e) => setDay(h.day_of_week, { is_closed: !e.target.checked })}
              className="h-4 w-4 accent-brand"
            />
            Open
          </label>
          {!h.is_closed ? (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <input
                type="time"
                value={h.open_time ?? "09:00"}
                onChange={(e) => setDay(h.day_of_week, { open_time: e.target.value })}
                className="h-9 rounded-lg border border-line bg-bg px-2 focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
              <span className="text-muted">to</span>
              <input
                type="time"
                value={h.close_time ?? "22:00"}
                onChange={(e) => setDay(h.day_of_week, { close_time: e.target.value })}
                className="h-9 rounded-lg border border-line bg-bg px-2 focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
            </div>
          ) : (
            <span className="ml-auto text-sm text-muted">Closed</span>
          )}
        </div>
      ))}
    </>
  );
}
