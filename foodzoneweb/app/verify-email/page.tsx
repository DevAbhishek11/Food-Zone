"use client";

import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";
import { CheckCircle2, Loader2, UtensilsCrossed, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type State = "verifying" | "success" | "error";

function VerifyEmailInner() {
  const sp = useSearchParams();
  const token = sp.get("token");
  const email = sp.get("email");
  const hasParams = !!token && !!email;

  const [state, setState] = useState<State>(hasParams ? "verifying" : "error");
  const [message, setMessage] = useState(
    hasParams ? "" : "This verification link is missing its token. Please use the link from your email.",
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!hasParams || ran.current) return;
    ran.current = true;

    api
      .post("/auth/verify-email", { token, email }, { auth: false })
      .then(() => setState("success"))
      .catch((e) => {
        setState("error");
        setMessage(e instanceof ApiError ? e.message : "We couldn't verify your email. The link may have expired.");
      });
  }, [hasParams, token, email]);

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft/80 p-8 shadow-lg backdrop-blur-xl text-center">
        <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl fz-gradient-brand shadow-brand">
          <UtensilsCrossed className="h-6 w-6 text-white" />
        </span>

        {state === "verifying" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted" />
            <p className="mt-4 text-sm text-muted">Verifying your email…</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h1 className="mt-3 text-xl font-semibold">Email verified</h1>
            <p className="mt-1 text-sm text-muted">Your account is now fully active.</p>
            <Link href="/">
              <Button className="mt-5 w-full">Go to FoodZone</Button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-danger" />
            <h1 className="mt-3 text-xl font-semibold">Verification failed</h1>
            <p className="mt-1 text-sm text-muted">{message}</p>
            <Link href="/">
              <Button variant="secondary" className="mt-5 w-full">Back to app</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-dvh items-center justify-center bg-bg">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </main>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
