"use client";

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type LoyaltyTier = "bronze" | "silver" | "gold" | "platinum";

export interface LoyaltyBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  awarded_at: string | null;
}

export interface LoyaltyTransactionRow {
  id: number;
  amount: number;
  reason: string;
  order_id: number | null;
  created_at: string;
}

export interface LoyaltySnapshot {
  points: number;
  lifetime_points: number;
  tier: LoyaltyTier;
  next_tier: { name: LoyaltyTier; points_to_go: number } | null;
  badges: LoyaltyBadge[];
  recent_transactions: LoyaltyTransactionRow[];
}

export function useLoyalty() {
  return useQuery({
    queryKey: ["me", "loyalty"],
    queryFn: () => api.get<LoyaltySnapshot>("/me/loyalty").then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export interface LeaderboardEntry {
  rank: number;
  user: { id: number; name: string; username: string };
  score: number;
}

export function useLeaderboard(type: "points" | "orders" | "reviews") {
  return useQuery({
    queryKey: ["leaderboard", type],
    queryFn: () => api.get<{ type: string; entries: LeaderboardEntry[] }>(`/leaderboard?type=${type}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
