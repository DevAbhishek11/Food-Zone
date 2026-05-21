"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Review, Vendor, VendorMenu } from "@/lib/types";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export interface VendorFilters {
  q?: string;
  city?: string;
  open_now?: boolean;
}

export function useVendors(filters: VendorFilters) {
  return useInfiniteQuery({
    queryKey: ["vendors", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      api.get<Vendor[]>("/vendors", {
        query: { page: pageParam, q: filters.q, city: filters.city, open_now: filters.open_now },
      }),
    getNextPageParam: (last: ApiEnvelope<Vendor[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}

export function useVendorMenu(idOrSlug: string) {
  return useQuery({
    queryKey: ["vendor-menu", idOrSlug],
    queryFn: () => api.get<VendorMenu>(`/vendors/${idOrSlug}/menu`),
  });
}

export function useVendorReviews(idOrSlug: string) {
  return useInfiniteQuery({
    queryKey: ["vendor-reviews", idOrSlug],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Review[]>(`/vendors/${idOrSlug}/reviews`, { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Review[]>) =>
      last.meta?.has_more ? last.meta.current_page + 1 : undefined,
  });
}
