"use client";

import { ReactivateScreen } from "@/components/ReactivateScreen";
import { AuthProvider } from "@/lib/auth-context";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Guards the dashboard area (admin/vendor): resolves the session, redirects guests. */
export default function DashLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    if (status === "idle") void hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  if (status === "deactivated" && user) {
    return <ReactivateScreen />;
  }

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return <AuthProvider user={user}>{children}</AuthProvider>;
}
