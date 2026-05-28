"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { FavoriteButton } from "@/components/vendors/FavoriteButton";
import { ItemCustomizeDialog } from "@/components/vendors/ItemCustomizeDialog";
import { VendorReviews } from "@/components/vendors/VendorReviews";
import { useAddresses } from "@/lib/hooks/use-addresses";
import { ApiError } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { money } from "@/lib/format";
import { useCheckoutQuote, usePlaceOrder } from "@/lib/hooks/use-orders";
import { useVendorMenu } from "@/lib/hooks/use-vendors";
import { toast } from "@/lib/toast-store";
import type { MenuItem } from "@/lib/types";
import { ArrowLeft, Minus, Plus, Star, X } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

  const { vendor, categories, uncategorized, popular_items: popularItems = [] } = data.data;
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
        <div className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="text-2xl font-semibold">{vendor.name}</h1>
            <FavoriteButton vendorId={vendor.id} initial={vendor.is_favorited} size={20} />
            {vendor.is_open ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
                <span className="h-1.5 w-1.5 rounded-full bg-success" /> Open
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-xs font-medium text-danger">
                <span className="h-1.5 w-1.5 rounded-full bg-danger" /> Closed
                {vendor.opens_at && (
                  <span className="text-muted">· Opens {new Date(vendor.opens_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</span>
                )}
              </span>
            )}
            {vendor.has_offer && (
              <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-medium text-brand">🎟 Offers</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1 text-warning">
              <Star className="h-4 w-4 fill-current" />
              {vendor.rating_avg > 0 ? vendor.rating_avg.toFixed(1) : "New"}
              <span className="text-muted">({vendor.rating_count})</span>
            </span>
            {vendor.delivery_estimate_min != null && (
              <span>🚴 {vendor.delivery_estimate_min}–{vendor.delivery_estimate_max} min</span>
            )}
            {vendor.delivery_fee > 0 && <span>· {money(vendor.delivery_fee)} delivery</span>}
            {vendor.free_delivery_above && <span>· Free above {money(vendor.free_delivery_above)}</span>}
            {vendor.min_order_value > 0 && <span>· Min {money(vendor.min_order_value)}</span>}
          </div>

          {vendor.tags && vendor.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {vendor.tags.map((t) => (
                <span key={t} className="rounded-full border border-line bg-surface px-2 py-0.5 text-xs text-muted">{t}</span>
              ))}
            </div>
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
                    <MenuItemRow
                      key={item.id}
                      item={item}
                      vendorId={vendor.id}
                      vendorName={vendor.name}
                      canOrder={vendor.is_open}
                      isPopular={popularItems.includes(item.id)}
                    />
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
  isPopular,
}: {
  item: MenuItem;
  vendorId: number;
  vendorName: string;
  canOrder: boolean;
  isPopular?: boolean;
}) {
  const add = useCartStore((s) => s.add);
  const [customizing, setCustomizing] = useState(false);

  const customizable =
    (item.variants?.length ?? 0) > 0 || (item.addons?.filter((a) => a.is_available).length ?? 0) > 0;

  const handleAdd = () => {
    if (customizable) {
      setCustomizing(true);
      return;
    }
    add(vendorId, vendorName, item);
    toast.success(`Added ${item.name}`);
  };

  return (
    <div className="flex items-start gap-4 rounded-card border border-line bg-bg-soft p-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {item.dietary_tags?.includes("veg") || item.dietary_tags?.includes("vegan") ? (
            <span title="Veg" className="flex h-4 w-4 items-center justify-center rounded border border-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
            </span>
          ) : item.dietary_tags?.includes("non-veg") || item.dietary_tags?.includes("non_veg") ? (
            <span title="Non-veg" className="flex h-4 w-4 items-center justify-center rounded border border-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
            </span>
          ) : null}
          <p className="font-medium">{item.name}</p>
          {isPopular && (
            <span className="rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-medium uppercase text-warning">🔥 Popular</span>
          )}
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{item.description}</p>}
        <p className="mt-1 text-sm font-semibold text-brand">{money(item.price)}</p>
        {customizable && <p className="text-xs text-muted">Customizable</p>}
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
        onClick={handleAdd}
      >
        {item.is_available ? (customizable ? "Choose" : "Add") : "Sold out"}
      </Button>

      {customizing && (
        <ItemCustomizeDialog
          item={item}
          onClose={() => setCustomizing(false)}
          onAdd={(selection) => {
            add(vendorId, vendorName, item, selection);
            toast.success(`Added ${item.name}`);
          }}
        />
      )}
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
  const { data: addresses } = useAddresses();
  const [payment, setPayment] = useState<"cod" | "upi" | "card" | "wallet">(codEnabled ? "cod" : "upi");
  const [addressId, setAddressId] = useState<number | null>(null);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<string | null>(null);

  const isThisVendor = cart.vendorId === vendorId;
  const lines = useMemo(() => (isThisVendor ? cart.lines : []), [isThisVendor, cart.lines]);
  const subtotal = isThisVendor ? cart.subtotal() : 0;
  const belowMin = subtotal < minOrder;

  const orderItems = useMemo(
    () =>
      lines.map((l) => ({
        item_id: l.itemId,
        quantity: l.quantity,
        variant_id: l.variantId ?? undefined,
        addon_ids: l.addonIds.length ? l.addonIds : undefined,
      })),
    [lines],
  );

  // Authoritative server pricing once a voucher is applied (re-runs if the
  // cart changes). Before that we show a local estimate for instant feedback.
  const quote = useCheckoutQuote(
    appliedCode ? { vendor_id: vendorId, voucher_code: appliedCode, items: orderItems } : null,
    !!appliedCode && lines.length > 0,
  );
  const validVoucher = quote.data?.voucher ?? null;
  const discount = validVoucher ? quote.data!.discount : 0;
  const localTotal = subtotal + (subtotal > 0 ? deliveryFee : 0);
  const total = quote.data ? quote.data.total : Math.max(0, localTotal);

  // Default to the user's default address once loaded.
  const effectiveAddressId = addressId ?? addresses?.find((a) => a.is_default)?.id ?? addresses?.[0]?.id ?? null;

  const applyVoucher = () => {
    const code = voucherInput.trim();
    if (code) setAppliedCode(code);
  };
  const clearVoucher = () => {
    setAppliedCode(null);
    setVoucherInput("");
  };

  const checkout = async () => {
    try {
      const order = await placeOrder.mutateAsync({
        vendor_id: vendorId,
        payment_method: payment,
        address_id: effectiveAddressId ?? undefined,
        // Only send the code if the server confirmed it; avoids a 422 on a bad code.
        voucher_code: validVoucher ? appliedCode! : undefined,
        items: orderItems,
      });
      cart.clear();
      clearVoucher();
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
              <li key={l.key} className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-line">
                  <button onClick={() => cart.setQuantity(l.key, l.quantity - 1)} className="px-2 py-1 text-muted hover:text-content" aria-label="Decrease">
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-6 text-center text-sm">{l.quantity}</span>
                  <button onClick={() => cart.setQuantity(l.key, l.quantity + 1)} className="px-2 py-1 text-muted hover:text-content" aria-label="Increase">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {l.name}
                  {l.label && <span className="block truncate text-xs text-muted">{l.label}</span>}
                </span>
                <span className="text-sm text-muted">{money(l.unitPrice * l.quantity)}</span>
              </li>
            ))}
          </ul>

          {/* Voucher */}
          <div className="mt-4 border-t border-line pt-3">
            {validVoucher ? (
              <div className="flex items-center justify-between rounded-lg bg-success/10 px-3 py-2 text-sm">
                <span className="font-medium text-success">{validVoucher.code} applied · −{money(discount)}</span>
                <button onClick={clearVoucher} aria-label="Remove voucher" className="text-muted hover:text-content">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value.toUpperCase())}
                  placeholder="Promo code"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-brand/60"
                  onKeyDown={(e) => e.key === "Enter" && applyVoucher()}
                />
                <Button size="sm" variant="secondary" onClick={applyVoucher} loading={quote.isFetching} disabled={!voucherInput.trim()}>
                  Apply
                </Button>
              </div>
            )}
            {appliedCode && quote.data?.voucher_error && (
              <p className="mt-1 text-xs text-danger">{quote.data.voucher_error}</p>
            )}
          </div>

          <div className="mt-4 space-y-1 border-t border-line pt-3 text-sm">
            <Row label="Subtotal" value={money(subtotal)} />
            {discount > 0 && <Row label="Discount" value={`−${money(discount)}`} />}
            <Row label="Delivery" value={deliveryFee > 0 ? money(deliveryFee) : "Free"} />
            <Row label="Total" value={money(total)} bold />
          </div>

          <label className="mt-3 block text-xs text-muted">Deliver to</label>
          {addresses && addresses.length > 0 ? (
            <select
              value={effectiveAddressId ?? ""}
              onChange={(e) => setAddressId(Number(e.target.value))}
              className="mt-1 h-9 w-full rounded-lg border border-line bg-bg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} — {a.city} {a.pincode}
                </option>
              ))}
            </select>
          ) : (
            <Link href="/addresses" className="mt-1 block text-sm text-brand hover:underline">
              + Add a delivery address
            </Link>
          )}

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
