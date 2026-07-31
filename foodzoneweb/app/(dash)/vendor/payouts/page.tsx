"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { exportCsv } from "@/lib/csv";
import { money } from "@/lib/format";
import { useVendorPayouts } from "@/lib/hooks/use-vendor-admin";
import { Download, Wallet } from "lucide-react";
import { useState } from "react";

const RANGES = [30, 90, 180];

export default function VendorPayoutsPage() {
  const [days, setDays] = useState(30);
  const [group, setGroup] = useState<"day" | "week">("day");
  const { data, isLoading, isError, refetch } = useVendorPayouts(days, group);

  const exportRows = () => {
    if (!data) return;
    exportCsv(
      `payouts-${group}-${new Date().toISOString().slice(0, 10)}`,
      data.series.map((r) => ({ date: r.date, gross: r.gross, commission: r.commission, net: r.net })),
    );
  };

  return (
    <>
      <PageHeader title="Revenue & Payouts" subtitle="What you've earned, after platform commission" />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
        ) : isError || !data ? (
          <ErrorState message="Couldn't load payouts. Are you a vendor?" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              <Stat icon={<Wallet className="h-5 w-5" />} tone="success" label="Lifetime net" value={money(data.lifetime_net)} />
              <Stat label="Lifetime gross" value={money(data.lifetime_gross)} />
              <Stat label="Lifetime commission" value={money(data.lifetime_commission)} />
            </div>

            {data.refunded_orders_excluded > 0 && (
              <p className="text-xs text-muted">
                {data.refunded_orders_excluded} refunded order{data.refunded_orders_excluded === 1 ? "" : "s"} in this
                range were excluded — refunds are not paid out.
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1 rounded-lg border border-line p-0.5">
                  {RANGES.map((r) => (
                    <button
                      key={r}
                      onClick={() => setDays(r)}
                      className={`rounded-md px-3 py-1 text-xs font-medium ${days === r ? "bg-brand text-white" : "text-muted hover:text-content"}`}
                    >
                      {r}d
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 rounded-lg border border-line p-0.5">
                  {(["day", "week"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setGroup(g)}
                      className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${group === g ? "bg-brand text-white" : "text-muted hover:text-content"}`}
                    >
                      {g}ly
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={exportRows}
                disabled={data.series.length === 0}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface hover:text-content disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
            </div>

            {data.series.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No delivered orders in this range yet.</p>
            ) : (
              <div className="overflow-hidden rounded-card border border-line">
                <table className="w-full text-sm">
                  <thead className="bg-bg-soft text-left text-xs text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">{group === "week" ? "Week of" : "Date"}</th>
                      <th className="px-3 py-2 text-right font-medium">Gross</th>
                      <th className="px-3 py-2 text-right font-medium">Commission</th>
                      <th className="px-3 py-2 text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.series.map((r) => (
                      <tr key={r.date}>
                        <td className="px-3 py-2">{r.date}</td>
                        <td className="px-3 py-2 text-right text-muted">{money(r.gross)}</td>
                        <td className="px-3 py-2 text-right text-muted">−{money(r.commission)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{money(r.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const STAT_TONES = {
  success: "bg-success/15 text-success",
  muted: "bg-surface text-muted",
} as const;

function Stat({ icon, label, value, tone = "muted" }: {
  icon?: React.ReactNode; label: string; value: string; tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-center gap-2.5">
        {icon && <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${STAT_TONES[tone]}`}>{icon}</span>}
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}
