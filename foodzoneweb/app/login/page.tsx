"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { applyApiError } from "@/lib/form-errors";
import { redirectAfterLogin } from "@/lib/redirect";
import { toast } from "@/lib/toast-store";
import type { AuthPayload } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, status, user } = useAuthStore();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "authenticated") router.replace(redirectAfterLogin(user?.role, user?.onboarding_completed));
  }, [status, user, router]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthPayload>("/auth/login", values, { auth: false });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      router.replace(redirectAfterLogin(data.user.role, data.user.onboarding_completed));
    } catch (e) {
      applyApiError(e, setError);
    }
  };

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft/80 p-8 shadow-lg backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="fz-gradient-brand flex h-12 w-12 items-center justify-center rounded-xl shadow-brand">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to FoodZone</h1>
          <p className="text-sm text-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 border-t border-line pt-4 text-xs text-muted">
          <Link href="/vendor/login" className="hover:text-content">
            Vendor Login →
          </Link>
          <Link href="/admin/login" className="hover:text-content">
            Admin Login →
          </Link>
        </div>
      </div>
    </main>
  );
}
