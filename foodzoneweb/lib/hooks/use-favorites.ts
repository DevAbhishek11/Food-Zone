"use client";

import { api } from "@/lib/api";
import type { ApiEnvelope, Order, Vendor } from "@/lib/types";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useFavorites() {
  return useInfiniteQuery({
    queryKey: ["favorites"],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => api.get<Vendor[]>("/favorites", { query: { page: pageParam } }),
    getNextPageParam: (last: ApiEnvelope<Vendor[]>) => (last.meta?.has_more ? last.meta.current_page + 1 : undefined),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["favorites"] });
    qc.invalidateQueries({ queryKey: ["vendors"] });
    qc.invalidateQueries({ queryKey: ["vendor-menu"] });
  };
  const favorite = useMutation({ mutationFn: (vendorId: number) => api.post(`/vendors/${vendorId}/favorite`), onSuccess: invalidate });
  const unfavorite = useMutation({ mutationFn: (vendorId: number) => api.del(`/vendors/${vendorId}/favorite`), onSuccess: invalidate });
  return { favorite, unfavorite };
}

export function useReorder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: number) => api.post<Order>(`/orders/${orderId}/reorder`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}
