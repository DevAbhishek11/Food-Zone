"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { VendorReviews } from "@/components/vendors/VendorReviews";
import { ApiError } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { money } from "@/lib/format";
import { usePlaceOrder } from "@/lib/hooks/use-orders";
import { useVendorMenu } from "@/lib/hooks/use-vendors";
import { toast } from "@/lib/toast-store";
import type { MenuItem } from "@/lib/types";
import { ArrowLeft, Minus, Plus, Star } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function VendorMenuPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useVendorMenu(params.id);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-6">
        <Skeleton className="h-40 w-full rounded-card" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full rounded-card" />
        <Skeleton className="h-24 w-full rounded-card" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <ErrorState message="Couldn't load this restaurant." onRetry={() => refetch()} />
      </div>
    );
  }

  const { vendor, categories, uncategorized } = data.data;
  const allGroups = [
    ...categories.map((c) => ({ name: c.name, items: c.items ?? [] })),
    ...(uncategorized.length ? [{ name: "More", items: uncategorized }] : []),
  ].filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
      <Link href="/vendors" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-content">
        <ArrowLeft className="h-4 w-4" /> All restaurants
      </Link>

      {/* Banner / header */}
      <div className="overflow-hidden rounded-card border border-line bg-bg-soft">
        <div className="h-40 w-full bg-surface">
          {vendor.banner && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={vendor.banner} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
          <span className="flex items-center gap-1 text-sm text-warning">
            <Star className="h-4 w-4 fill-current" />
            {vendor.rating_avg > 0 ? vendor.rating_avg.toFixed(1) : "New"}
            <span className="text-muted">({vendor.rating_count})</span>
          </span>
          <span className="text-sm text-muted">· {vendor.prep_time_minutes} min</span>
          {vendor.min_order_value > 0 && (
            <span className="text-sm text-muted">· Min {money(vendor.min_order_value)}</span>
          )}
          {!vendor.is_open && (
            <span className="rounded-full bg-danger/90 px-2 py-0.5 text-xs font-medium text-white">Closed</span>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Menu */}
        <div className="space-y-8">
          {allGroups.length === 0 ? (
            <EmptyState title="No items yet" hint="This restaurant hasn't added menu items." />
          ) : (
            allGroups.map((group) => (
              <section key={group.name}>
                <h2 className="mb-3 text-lg font-semibold">{group.name}</h2>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <MenuItemRow key={item.id} item={item} vendorId={vendor.id} vendorName={vendor.name} canOrder={vendor.is_open} />
                  ))}
                </div>
              </section>
            ))
          )}

          <section>
            <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
            <VendorReviews idOrSlug={params.id} />
          </section>
        </div>

        {/* Cart */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <CartPanel vendorId={vendor.id} vendorName={vendor.name} minOrder={vendor.min_order_value} deliveryFee={vendor.delivery_fee} codEnabled={vendor.cod_enabled} isOpen={vendor.is_open} />
        </div>
      </div>
    </div>
  );
}

function MenuItemRow({
  item,
  vendorId,
  vendorName,
  canOrder,
}: {
  item: MenuItem;
  vendorId: number;
  vendorName: string;
  canOrder: boolean;
}) {
  const add = useCartStore((s) => s.add);

  return (
    <div className="flex items-start gap-4 rounded-card border border-line bg-bg-soft p-4">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{item.name}</p>
        {item.description && <p className="line-clamp-2 text-sm text-muted">{item.description}</p>}
        <p className="mt-1 text-sm font-semibold text-brand">{money(item.price)}</p>
        {item.dietary_tags?.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.dietary_tags.map((t) => (
              <span key={t} className="rounded bg-surface px-1.5 py-0.5 text-[10px] uppercase text-muted">{t}</span>
            ))}
          </div>
        )}
      </div>
      <Button
        size="sm"
        variant={item.is_available && canOrder ? "primary" : "secondary"}
        disabled={!item.is_available || !canOrder}
        onClick={() => {
          add(vendorId, vendorName, item);
          toast.success(`Added ${item.name}`);
        }}
      >
        {item.is_available ? "Add" : "Sold out"}
      </Button>
    </div>
  );
}

function CartPanel({
  vendorId,
  vendorName,
  minOrder,
  deliveryFee,
  codEnabled,
  isOpen,
}: {
  vendorId: number;
  vendorName: string;
  minOrder: number;
  deliveryFee: number;
  codEnabled: boolean;
  isOpen: boolean;
}) {
  const router = useRouter();
  const cart = useCartStore();
  const placeOrder = usePlaceOrder();
  const [payment, setPayment] = useState<"cod" | "upi" | "card" | "wallet">(codEnabled ? "cod" : "upi");

  const isThisVendor = cart.vendorId === vendorId;
  const lines = isThisVendor ? cart.lines : [];
  const subtotal = isThisVendor ? cart.subtotal() : 0;
  const belowMin = subtotal < minOrder;
  const total = subtotal + (subtotal > 0 ? deliveryFee : 0);

  const checkout = async () => {
    try {
      const order = await placeOrder.mutateAsync({
        vendor_id: vendorId,
        payment_method: payment,
        items: lines.map((l) => ({ item_id: l.itemId, quantity: l.quantity })),
      });
      cart.clear();
      toast.success(`Order ${order.data.order_number} placed!`);
      router.push("/orders");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not place order.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <h2 className="mb-3 font-semibold">Your order {isThisVendor && `· ${vendorName}`}</h2>

      {lines.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Your cart is empty.</p>
      ) : (
        <>
          <ul className="space-y-3">
            {lines.map((l) => (
              <li key={l.itemId} className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-line">
                  <button onClick={() => cart.setQuantity(l.itemId, l.quantity - 1)} className="px-2 py-1 text-muted hover:text-content" aria-label="Decrease">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{l.quantity}</span>
                  <button onClick={() => cart.setQuantity(l.itemId, l.quantity + 1)} className="px-2 py-1 text-muted hover:text-content" aria-label="Increase">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">{l.name}</span>
                <span className="text-sm text-muted">{money(l.price * l.quantity)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            <Row label="Delivery" value={deliveryFee > 0 ? money(deliveryFee) : "Free"} />
            <Row label="Total" value={money(total)} bold />
          </div>

          <label className="mt-3 block text-xs text-muted">Payment</label>
          <select
            value={payment}
            onChange={(e) => setPayment(e.target.value as typeof payment)}
            className="mt-1 h-9 w-full rounded-lg border border-line bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            {codEnabled && <option value="cod">Cash on delivery</option>}
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="wallet">Wallet</option>
          </select>

          {belowMin && (
            <p className="mt-2 text-xs text-warning">Add {money(minOrder - subtotal)} more to reach the minimum order.</p>
          )}

          <Button
            className="mt-3 w-full"
            disabled={!isOpen || belowMin}
            loading={placeOrder.isPending}
            onClick={checkout}
          >
            {isOpen ? `Place order · ${money(total)}` : "Restaurant closed"}
          </Button>
        </>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-content" : "text-muted"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
