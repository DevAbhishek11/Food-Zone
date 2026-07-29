"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { ApiError } from "@/lib/api";
import { money } from "@/lib/format";
import { useLoyalty } from "@/lib/hooks/use-loyalty";
import { useRedeemPoints, useWallet, useWalletTransactions } from "@/lib/hooks/use-wallet";
import { toast } from "@/lib/toast-store";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Sparkles, Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TYPE_LABEL: Record<string, string> = {
  order_payment: "Order payment",
  order_refund: "Order refund",
  loyalty_redemption: "Points redeemed",
  admin_credit: "Credit issued",
  admin_debit: "Debit issued",
};

export default function WalletPage() {
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: loyalty } = useLoyalty();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useWalletTransactions();
  const redeem = useRedeemPoints();
  const [redeemInput, setRedeemInput] = useState("");

  const transactions = data?.pages.flatMap((p) => p.data) ?? [];
  const minPoints = 100; // mirrors config('loyalty.min_redeem_points') default

  const onRedeem = async () => {
    const points = Number(redeemInput);
    if (!Number.isInteger(points) || points < minPoints) {
      toast.error(`Enter at least ${minPoints} points.`);
      return;
    }
    try {
      const res = await redeem.mutateAsync(points);
      toast.success(`Redeemed ${res.data.points_redeemed} points for ${money(res.data.wallet_credit)}.`);
      setRedeemInput("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not redeem points.");
    }
  };

  return (
    <>
      <PageHeader
        title="Wallet"
        subtitle="FoodZone Credits"
        action={
          <Link href="/profile" className="flex items-center gap-1 text-sm text-muted hover:text-content">
            <ArrowLeft className="h-4 w-4" /> Profile
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-2xl space-y-4 p-4 md:p-6">
        <div className="fz-gradient-brand rounded-card p-6 text-white shadow-brand">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <WalletIcon className="h-4 w-4" /> Balance
          </div>
          {walletLoading ? (
            <div className="mt-2 h-9 w-32 animate-pulse rounded bg-white/20" />
          ) : (
            <p className="mt-1 font-display text-3xl font-semibold">{money(wallet?.balance ?? 0)}</p>
          )}
          <p className="mt-1 text-xs opacity-80">Use it as a payment method at checkout — covers the full order.</p>
        </div>

        {loyalty && loyalty.points >= minPoints && (
          <div className="rounded-card border border-line bg-bg-soft p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-brand" /> Redeem points
            </div>
            <p className="mt-1 text-xs text-muted">
              You have <strong>{loyalty.points.toLocaleString()}</strong> points — redeemable for wallet credit
              (min {minPoints}).
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={redeemInput}
                onChange={(e) => setRedeemInput(e.target.value.replace(/\D/g, ""))}
                placeholder={`${minPoints}+`}
                inputMode="numeric"
                className="h-9 flex-1 rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
              <Button size="sm" loading={redeem.isPending} onClick={onRedeem} disabled={!redeemInput}>
                Redeem
              </Button>
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-semibold text-muted">Transaction history</h2>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
          ) : isError ? (
            <ErrorState message="Couldn't load transactions." onRetry={() => refetch()} />
          ) : transactions.length === 0 ? (
            <EmptyState title="No transactions yet" hint="Wallet activity will show up here." />
          ) : (
            <div className="divide-y divide-line rounded-card border border-line bg-bg-soft">
              {transactions.map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-full ${t.amount >= 0 ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                    {t.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{TYPE_LABEL[t.type] ?? t.type}</p>
                    <p className="truncate text-xs text-muted">{t.note ?? new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-semibold ${t.amount >= 0 ? "text-success" : "text-danger"}`}>
                    {t.amount >= 0 ? "+" : ""}{money(t.amount)}
                  </span>
                </div>
              ))}
              {hasNextPage && (
                <div className="flex justify-center p-3">
                  <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
