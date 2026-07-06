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
import { Store } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});
type FormValues = z.infer<typeof schema>;

export default function VendorLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthPayload>("/auth/login", values, { auth: false });
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(" ")[0]}!`);
      router.replace(redirectAfterLogin(data.user.role));
    } catch (e) {
      applyApiError(e, setError);
    }
  };

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-warning/30 bg-bg-soft p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning">
            <Store className="h-6 w-6 text-black" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Vendor Portal</h1>
          <p className="text-sm text-muted">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="email" type="email" label="Email" placeholder="you@restaurant.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input id="password" type="password" label="Password" placeholder="••••••••" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            Sign in to dashboard
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Not a vendor yet?{" "}
          <Link href="/vendor/register" className="font-medium text-warning hover:underline">
            Apply to join →
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-muted">
          <Link href="/login" className="hover:text-content">
            ← Customer login
          </Link>
        </p>
      </div>
    </main>
  );
}
