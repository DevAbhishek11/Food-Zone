"use client";

import { AppShell } from "@/components/AppShell";
import { ReactivateScreen } from "@/components/ReactivateScreen";
import { AuthProvider } from "@/lib/auth-context";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

/** Guards the authenticated area: resolves the session, redirects guests. */
export default function AppLayout({ children }: { children: ReactNode }) {
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

  // A network blip or backend hiccup while resolving the session — distinct
  // from "guest" so it doesn't silently bounce a real user to /login.
  if (status === "error") {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-4 text-center">
        <p className="text-sm text-muted">Couldn&apos;t reach the server. Check your connection.</p>
        <button onClick={() => hydrate()} className="text-sm font-medium text-brand hover:underline">
          Try again
        </button>
      </div>
    );
  }

  // Render children only once we have a resolved, non-null user.
  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <AuthProvider user={user}>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
