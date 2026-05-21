"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { AdminNav } from "@/components/admin/AdminNav";
import { money } from "@/lib/format";
import { useAdminDashboard } from "@/lib/hooks/use-admin";

export default function AdminDashboardPage() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  return (
    <>
      <PageHeader title="Admin" subtitle="Platform overview" />
      <AdminNav />

      <div className="mx-auto w-full max-w-4xl space-y-5 p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-card" />)}
          </div>
        ) : isError || !data ? (
          <ErrorState message="Couldn't load admin metrics. Admins only." onRetry={() => refetch()} />
        ) : (
          <>
            <Section title="Today">
              <Stat label="New users" value={String(data.users_new_today)} />
              <Stat label="Orders" value={String(data.orders_today)} />
              <Stat label="Revenue" value={money(data.revenue_today)} />
              <Stat label="Commission" value={money(data.commission_today)} />
            </Section>
            <Section title="Platform totals">
              <Stat label="Users" value={String(data.users_total)} />
              <Stat label="Vendors" value={`${data.vendors_approved}/${data.vendors_total}`} hint="approved/total" />
              <Stat label="Pending vendors" value={String(data.vendors_pending)} highlight={data.vendors_pending > 0} />
              <Stat label="Orders" value={String(data.orders_total)} />
              <Stat label="Posts" value={String(data.posts_total)} />
            </Section>
          </>
        )}
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-muted">{title}</h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{children}</div>
    </section>
  );
}

function Stat({ label, value, hint, highlight }: { label: string; value: string; hint?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-card border p-4 ${highlight ? "border-warning/50 bg-warning/5" : "border-line bg-bg-soft"}`}>
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="text-[11px] text-muted">{hint}</p>}
    </div>
  );
}
