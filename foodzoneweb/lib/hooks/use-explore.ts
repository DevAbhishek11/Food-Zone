"use client";

import { api } from "@/lib/api";
import type { MenuItem, Post, Vendor } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export interface TrendingVendorRow {
  vendor: Vendor;
  orders_24h: number;
  order_delta: number;
}

export interface TrendingHashtagRow {
  tag: string;
  count: number;
}

export interface TrendingItemRow {
  item: MenuItem;
  recent_orders: number;
}

export interface SuggestedUserRow {
  user: { id: number; name: string; username: string; avatar: string | null; role?: string };
  mutual_count: number;
  reason: "mutuals" | "popular";
}

export interface ExplorePayload {
  trending_posts: Post[];
  trending_vendors: TrendingVendorRow[];
  trending_hashtags: TrendingHashtagRow[];
  trending_items: TrendingItemRow[];
  suggested_users: SuggestedUserRow[];
  nearby_vendors: (Vendor & { distance_km: number })[];
}

export interface ExploreMapVendor {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  lat: number;
  lng: number;
  rating_avg: number;
  is_open: boolean;
  is_featured: boolean;
}

export function useExplore(coords?: { lat: number; lng: number } | null) {
  return useQuery({
    queryKey: ["explore", coords?.lat ?? null, coords?.lng ?? null],
    queryFn: () =>
      api
        .get<ExplorePayload>("/explore", {
          query: coords ? { lat: coords.lat, lng: coords.lng, radius: 10 } : undefined,
        })
        .then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

export function useExploreMap() {
  return useQuery({
    queryKey: ["explore-map"],
    queryFn: () => api.get<ExploreMapVendor[]>("/explore/map").then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
