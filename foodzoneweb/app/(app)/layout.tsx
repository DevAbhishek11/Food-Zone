"use client";

import { AppShell } from "@/components/AppShell";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Guards the authenticated area: resolves the session, redirects guests. */
export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, hydrate } = useAuthStore();

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
