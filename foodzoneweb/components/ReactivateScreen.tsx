"use client";

import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast-store";
import type { User } from "@/lib/types";
import { UtensilsCrossed } from "lucide-react";
import { useState } from "react";

/**
 * Shown instead of the app when the signed-in account is deactivated —
 * either self-deactivated or mid-way through the 30-day account-deletion
 * grace period. Reactivating here cancels a pending deletion.
 */
export function ReactivateScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const [loading, setLoading] = useState(false);

  const reactivate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post<User>("/profile/reactivate");
      setUser(data);
      toast.success("Welcome back — your account is active again.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not reactivate.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-8 text-center">
        <span className="fz-gradient-brand mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
          <UtensilsCrossed className="h-6 w-6 text-white" />
        </span>
        <h1 className="text-xl font-semibold">Your account is deactivated</h1>
        <p className="mt-2 text-sm text-muted">
          If you requested deletion, reactivating now cancels it — your data is safe and nothing is lost.
        </p>
        <Button className="mt-5 w-full" onClick={reactivate} loading={loading}>
          Reactivate my account
        </Button>
        <button onClick={() => logout()} className="mt-3 text-sm text-muted hover:text-content">
          Log out instead
        </button>
      </div>
    </div>
  );
}
