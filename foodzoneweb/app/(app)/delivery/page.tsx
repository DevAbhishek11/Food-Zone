"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useAuthStore } from "@/lib/auth-store";
import { cn } from "@/lib/cn";
import { money, timeAgo } from "@/lib/format";
import {
  useAcceptDelivery,
  useAvailableDeliveries,
  useBecomeDeliveryPartner,
  useDeliverOrder,
  useDeliveryStats,
  useMyDeliveries,
  usePickUpDelivery,
  useReleaseDelivery,
} from "@/lib/hooks/use-delivery";
import { toast } from "@/lib/toast-store";
import type { Order } from "@/lib/types";
import { Bike } from "lucide-react";
import { useState } from "react";

type Tab = "available" | "active" | "completed";

export default function DeliveryPage() {
  const { user } = useAuth();
  const isPartner = user.role === "delivery" || user.role === "admin" || user.role === "super_admin";

  if (!isPartner) return <BecomePartner />;
  return <DeliveryDashboard />;
}

function BecomePartner() {
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const become = useBecomeDeliveryPartner();

  const join = async () => {
    try {
      await become.mutateAsync();
      if (user) setUser({ ...user, role: "delivery" });
      toast.success("You're now a delivery partner!");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not register.");
    }
  };

  return (
    <>
      <PageHeader title="Delivery" />
      <div className="mx-auto w-full max-w-md p-4">
        <div className="rounded-card border border-line bg-bg-soft p-6 text-center">
          <Bike className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-3 text-lg font-semibold">Become a delivery partner</h2>
          <p className="mt-1 text-sm text-muted">
            Accept nearby orders, pick them up, and deliver to earn. You can switch back anytime.
          </p>
          <Button className="mt-4 w-full" loading={become.isPending} onClick={join}>
            Start delivering
          </Button>
        </div>
      </div>
    </>
  );
}

function DeliveryDashboard() {
  const [tab, setTab] = useState<Tab>("available");
  const { data: stats } = useDeliveryStats();

  const available = useAvailableDeliveries(tab === "available");
  const active = useMyDeliveries("active", tab === "active");
  const completed = useMyDeliveries("completed", tab === "completed");

  const accept = useAcceptDelivery();
  const release = useReleaseDelivery();
  const pickUp = usePickUpDelivery();
  const deliver = useDeliverOrder();

  const run = async (p: Promise<unknown>, ok: string) => {
    try {
      await p;
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Action failed.");
    }
  };

  const current = tab === "available" ? available : tab === "active" ? active : completed;

  return (
    <>
      <PageHeader title="Deliveries" subtitle="Accept and fulfil orders" />

      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Active" value={stats?.active ?? 0} />
          <StatCard label="Delivered today" value={stats?.delivered_today ?? 0} />
          <StatCard label="Total delivered" value={stats?.total_delivered ?? 0} />
        </div>

        <div className="flex gap-1 rounded-lg border border-line bg-bg-soft p-1 text-sm">
          {(["available", "active", "completed"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 capitalize transition",
                tab === t ? "bg-brand text-white" : "text-muted hover:text-content",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {current.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-card" />)
        ) : current.isError ? (
          <ErrorState message="Couldn't load deliveries." onRetry={() => current.refetch()} />
        ) : (current.data?.length ?? 0) === 0 ? (
          <EmptyState
            title={tab === "available" ? "No orders to pick up" : tab === "active" ? "No active deliveries" : "No completed deliveries"}
            hint={tab === "available" ? "New orders appear here when restaurants are ready." : undefined}
          />
        ) : (
          current.data!.map((o) => (
            <DeliveryCard
              key={o.id}
              order={o}
              tab={tab}
              busy={accept.isPending || release.isPending || pickUp.isPending || deliver.isPending}
              onAccept={() => run(accept.mutateAsync(o.id), "Delivery accepted")}
              onRelease={() => run(release.mutateAsync(o.id), "Delivery released")}
              onPickUp={() => run(pickUp.mutateAsync(o.id), "Marked as picked up")}
              onDeliver={() => run(deliver.mutateAsync(o.id), "Marked as delivered")}
            />
          ))
        )}
      </div>
    </>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-bg-soft p-3 text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function DeliveryCard({
  order,
  tab,
  busy,
  onAccept,
  onRelease,
  onPickUp,
  onDeliver,
}: {
  order: Order;
  tab: Tab;
  busy: boolean;
  onAccept: () => void;
  onRelease: () => void;
  onPickUp: () => void;
  onDeliver: () => void;
}) {
  const addr = order.delivery_address;
  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{order.vendor?.name ?? "Restaurant"}</p>
          <p className="text-xs text-muted">
            {order.order_number} · {timeAgo(order.created_at)} · {order.payment_method.toUpperCase()}
          </p>
        </div>
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-medium capitalize text-muted">
          {order.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="mt-2 text-sm text-muted">
        {order.items?.length ?? 0} item(s) · {money(order.total)}
        {addr && (
          <span className="block truncate">
            Deliver to: {addr.address}
            {addr.city ? `, ${addr.city}` : ""}
          </span>
        )}
      </div>

      <div className="mt-3 flex justify-end gap-2 border-t border-line pt-3">
        {tab === "available" && (
          <Button size="sm" disabled={busy} onClick={onAccept}>
            Accept
          </Button>
        )}
        {tab === "active" && order.status === "ready" && (
          <>
            <Button size="sm" variant="secondary" disabled={busy} onClick={onRelease}>
              Release
            </Button>
            <Button size="sm" disabled={busy} onClick={onPickUp}>
              Mark picked up
            </Button>
          </>
        )}
        {tab === "active" && order.status === "out_for_delivery" && (
          <Button size="sm" disabled={busy} onClick={onDeliver}>
            Mark delivered
          </Button>
        )}
        {tab === "active" && (order.status === "preparing" || order.status === "accepted") && (
          <Button size="sm" variant="secondary" disabled={busy} onClick={onRelease}>
            Release
          </Button>
        )}
      </div>
    </div>
  );
}
