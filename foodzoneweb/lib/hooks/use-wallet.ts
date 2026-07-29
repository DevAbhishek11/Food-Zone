"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface WalletTransaction {
  id: number;
  amount: number;
  balance_after: number;
  type: string;
  note: string | null;
  created_at: string;
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.get<{ balance: number }>("/wallet"),
    select: (e) => e.data,
  });
}

export function useWalletTransactions() {
  return useInfiniteQuery({
    queryKey: ["wallet-transactions"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<WalletTransaction[]>("/wallet/transactions", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<WalletTransaction[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

/** Convert loyalty points into wallet credit at the platform's configured rate. */
export function useRedeemPoints() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (points: number) =>
      api.post<{ points_redeemed: number; wallet_credit: number; remaining_points: number }>("/loyalty/redeem", { points }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      qc.invalidateQueries({ queryKey: ["me", "loyalty"] });
    },
  });
}
