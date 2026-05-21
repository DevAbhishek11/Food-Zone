"use client";

import { api } from "@/lib/api";
import type { Address } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface AddressInput {
  label?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  is_default?: boolean;
}

export function useAddresses() {
  return useQuery({ queryKey: ["addresses"], queryFn: () => api.get<Address[]>("/addresses"), select: (e) => e.data });
}

export function useSaveAddress() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["addresses"] });
  const create = useMutation({ mutationFn: (body: AddressInput) => api.post<Address>("/addresses", body), onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: AddressInput }) => api.put<Address>(`/addresses/${id}`, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: (id: number) => api.del(`/addresses/${id}`), onSuccess: invalidate });
  return { create, update, remove };
}
