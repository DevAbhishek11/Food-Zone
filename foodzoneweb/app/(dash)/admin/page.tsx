"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { money } from "@/lib/format";
import { useAdminAnalytics, useAdminDashboard } from "@/lib/hooks/use-admin";
import { Clock, Receipt, Store, TrendingUp, Users, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

// Recharts ships ~100 KB of D3 internals. Lazy + ssr:false keeps it out of
// the initial admin bundle and off the SSR render path.
const chartFallback = <Skeleton className="h-60 w-full" />;
const RevenueChart = dynamic(() => import("@/components/admin/Charts").then((m) => m.RevenueChart), { ssr: false, loading: () => chartFallback });
const OrdersChart = dynamic(() => import("@/components/admin/Charts").then((m) => m.OrdersChart), { ssr: false, loading: () => chartFallback });
const StatusPie = dynamic(() => import("@/components/admin/Charts").then((m) => m.StatusPie), { ssr: false, loading: () => chartFallback });

const RANGES = [7, 14, 30];

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();
  const [days, setDays] = useState(14);
  const analytics = useAdminAnalytics(days);

  return (
    <>
      <PageHeader title="Overview" subtitle="Platform health & analytics" />

      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
        ) : isError || !data ? (
          <ErrorState message="Couldn't load admin metrics. Admins only." onRetry={() => refetch()} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={<Wallet className="h-5 w-5 text-success" />} label="Revenue today" value={money(data.revenue_today)} />
            <Kpi icon={<Receipt className="h-5 w-5 text-info" />} label="Orders today" value={String(data.orders_today)} />
            <Kpi icon={<TrendingUp className="h-5 w-5 text-brand" />} label="Commission today" value={money(data.commission_today)} />
            <Kpi icon={<Clock className="h-5 w-5 text-warning" />} label="Pending vendors" value={String(data.vendors_pending)} highlight={data.vendors_pending > 0} />
            <Kpi icon={<Users className="h-5 w-5 text-info" />} label="Users" value={String(data.users_total)} />
            <Kpi icon={<Store className="h-5 w-5 text-success" />} label="Vendors" value={`${data.vendors_approved}/${data.vendors_total}`} />
            <Kpi icon={<Receipt className="h-5 w-5 text-muted" />} label="Total orders" value={String(data.orders_total)} />
            <Kpi icon={<Users className="h-5 w-5 text-muted" />} label="Posts" value={String(data.posts_total)} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted">Trends</h2>
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
        </div>

        {analytics.isLoading ? (
          <Skeleton className="h-64 rounded-card" />
        ) : analytics.data ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Revenue"><RevenueChart data={analytics.data.revenue_series} /></ChartCard>
              <ChartCard title="Orders per day"><OrdersChart data={analytics.data.revenue_series} /></ChartCard>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Order status"><StatusPie data={analytics.data.status_distribution} /></ChartCard>
              <ChartCard title="Top vendors">
                <ul className="divide-y divide-line">
                  {analytics.data.top_vendors.length === 0 && <li className="py-6 text-center text-sm text-muted">No data yet.</li>}
                  {analytics.data.top_vendors.map((v, i) => (
                    <li key={v.id} className="flex items-center gap-3 py-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">{i + 1}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{v.name}</span>
                      <span className="text-xs text-muted">★ {v.rating_avg > 0 ? v.rating_avg.toFixed(1) : "—"}</span>
                      <span className="text-sm font-semibold">{v.orders_count} orders</span>
                    </li>
                  ))}
                </ul>
              </ChartCard>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}

function Kpi({ icon, label, value, highlight }: { icon: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-card border p-4 ${highlight ? "border-warning/50 bg-warning/5" : "border-line bg-bg-soft"}`}>
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <h3 className="mb-3 text-sm font-semibold text-muted">{title}</h3>
      {children}
    </div>
  );
}
