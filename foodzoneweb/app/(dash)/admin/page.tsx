"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { money } from "@/lib/format";
import { useAdminAnalytics, useAdminDashboard } from "@/lib/hooks/use-admin";
import { ArrowRight, Clock, Receipt, Store, TrendingUp, Users, Wallet } from "lucide-react";
import Link from "next/link";
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
          <>
            {/* Needs attention */}
            {(data.vendors_pending > 0 || (data.reports_open ?? 0) > 0) && (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.vendors_pending > 0 && (
                  <QuickAction
                    href="/admin/vendors"
                    tone="warning"
                    title={`${data.vendors_pending} vendor application${data.vendors_pending === 1 ? "" : "s"} waiting`}
                    hint="Review and approve new stores"
                  />
                )}
                {(data.reports_open ?? 0) > 0 && (
                  <QuickAction
                    href="/admin/reports"
                    tone="danger"
                    title={`${data.reports_open} open report${data.reports_open === 1 ? "" : "s"}`}
                    hint="Moderation queue needs a decision"
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={<Wallet className="h-5 w-5" />} tone="success" label="Revenue today" value={money(data.revenue_today)} />
              <Kpi icon={<Receipt className="h-5 w-5" />} tone="info" label="Orders today" value={String(data.orders_today)} />
              <Kpi icon={<TrendingUp className="h-5 w-5" />} tone="brand" label="Commission today" value={money(data.commission_today)} />
              <Kpi icon={<Clock className="h-5 w-5" />} tone="warning" label="Pending vendors" value={String(data.vendors_pending)} highlight={data.vendors_pending > 0} />
              <Kpi icon={<Users className="h-5 w-5" />} tone="info" label="Users" value={String(data.users_total)} sub={`+${data.users_new_today} today`} />
              <Kpi icon={<Store className="h-5 w-5" />} tone="success" label="Vendors" value={`${data.vendors_approved}/${data.vendors_total}`} />
              <Kpi icon={<Receipt className="h-5 w-5" />} tone="muted" label="Total orders" value={String(data.orders_total)} />
              <Kpi icon={<Users className="h-5 w-5" />} tone="muted" label="Posts" value={String(data.posts_total)} />
            </div>
          </>
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

const KPI_TONES = {
  success: "bg-success/15 text-success",
  info: "bg-info/15 text-info",
  brand: "bg-brand/15 text-brand",
  warning: "bg-warning/15 text-warning",
  muted: "bg-surface text-muted",
} as const;

function Kpi({ icon, label, value, sub, tone = "muted", highlight }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; tone?: keyof typeof KPI_TONES; highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-card border p-4 transition-colors ${highlight ? "border-warning/50 bg-warning/5" : "border-line bg-bg-soft hover:border-border-strong"}`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${KPI_TONES[tone]}`}>{icon}</span>
        <span className="text-xs text-muted">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">
        {value}
        {sub && <span className="ml-2 align-middle text-xs font-normal text-success">{sub}</span>}
      </p>
    </div>
  );
}

const QA_TONES = {
  warning: "border-warning/40 bg-warning/5 hover:bg-warning/10",
  danger: "border-danger/40 bg-danger/5 hover:bg-danger/10",
} as const;

function QuickAction({ href, title, hint, tone }: { href: string; title: string; hint: string; tone: keyof typeof QA_TONES }) {
  return (
    <Link href={href} className={`group flex items-center justify-between gap-3 rounded-card border p-4 transition-colors ${QA_TONES[tone]}`}>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
    </Link>
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
