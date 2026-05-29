"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { VendorNav } from "@/components/vendor/VendorNav";
import { money } from "@/lib/format";
import { useToggleStoreOpen, useVendorAnalytics, useVendorStats } from "@/lib/hooks/use-vendor-admin";
import { toast } from "@/lib/toast-store";
import { Clock, ShoppingBag, Star, Wallet } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

const chartFallback = <Skeleton className="h-60 w-full" />;
const RevenueChart = dynamic(() => import("@/components/admin/Charts").then((m) => m.RevenueChart), { ssr: false, loading: () => chartFallback });
const OrdersChart = dynamic(() => import("@/components/admin/Charts").then((m) => m.OrdersChart), { ssr: false, loading: () => chartFallback });
const StatusPie = dynamic(() => import("@/components/admin/Charts").then((m) => m.StatusPie), { ssr: false, loading: () => chartFallback });

const RANGES = [7, 14, 30];

export default function VendorDashboardPage() {
  const { data: stats, isLoading, isError, refetch } = useVendorStats();
  const toggle = useToggleStoreOpen();
  const [days, setDays] = useState(14);
  const analytics = useVendorAnalytics(days);

  const setOpen = async (is_open: boolean) => {
    try {
      await toggle.mutateAsync({ is_open });
      toast.success(is_open ? "Store is now open" : "Store is now closed");
    } catch {
      toast.error("Could not update store status.");
    }
  };

  return (
    <>
      <PageHeader title="My Store" subtitle="Vendor dashboard" />
      <VendorNav />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
        ) : isError || !stats ? (
          <ErrorState message="Couldn't load your dashboard. Are you a vendor?" onRetry={() => refetch()} />
        ) : (
          <>
            <div className="flex items-center justify-between rounded-card border border-line bg-bg-soft p-4">
              <div>
                <p className="font-medium">Store status</p>
                <p className="text-sm text-muted">{stats.is_open ? "Accepting orders" : "Closed — not accepting orders"}</p>
              </div>
              <Button
                variant={stats.is_open ? "danger" : "primary"}
                loading={toggle.isPending}
                onClick={() => setOpen(!stats.is_open)}
              >
                {stats.is_open ? "Close store" : "Open store"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={<Clock className="h-5 w-5 text-warning" />} label="Pending" value={String(stats.pending_orders)} />
              <StatCard icon={<ShoppingBag className="h-5 w-5 text-info" />} label="Orders today" value={String(stats.orders_today)} />
              <StatCard icon={<Wallet className="h-5 w-5 text-success" />} label="Revenue today" value={money(stats.revenue_today)} />
              <StatCard icon={<Star className="h-5 w-5 text-warning" />} label="Rating" value={stats.rating_avg > 0 ? `${stats.rating_avg.toFixed(1)} (${stats.rating_count})` : "—"} />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Active orders" value={String(stats.active_orders)} />
              <StatCard label="Total orders" value={String(stats.total_orders)} />
              <StatCard label="Menu items" value={String(stats.menu_items)} />
            </div>

            <div className="flex items-center justify-between pt-2">
              <h2 className="text-sm font-semibold text-muted">Sales trends</h2>
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
                  <ChartCard title={`Revenue · lifetime ${money(analytics.data.lifetime_revenue)}`}>
                    <RevenueChart data={analytics.data.revenue_series} />
                  </ChartCard>
                  <ChartCard title="Orders per day"><OrdersChart data={analytics.data.revenue_series} /></ChartCard>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Order status"><StatusPie data={analytics.data.status_distribution} /></ChartCard>
                  <ChartCard title="Top items">
                    <ul className="divide-y divide-line">
                      {analytics.data.top_items.length === 0 && <li className="py-6 text-center text-sm text-muted">No sales yet.</li>}
                      {analytics.data.top_items.map((it, i) => (
                        <li key={it.id} className="flex items-center gap-3 py-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate text-sm font-medium">{it.name}</span>
                          <span className="text-sm font-semibold">{it.orders_count} sold</span>
                        </li>
                      ))}
                    </ul>
                  </ChartCard>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </>
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

function StatCard({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
