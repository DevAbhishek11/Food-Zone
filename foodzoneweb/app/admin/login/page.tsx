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
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
  // 2FA scaffold — collected when present; backend wiring is a later phase.
  code: z.string().optional().or(z.literal("")),
});
type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const password = useWatch({ control, name: "password" });
  const showTwoFactor = (password ?? "").length > 0;

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthPayload>(
        "/auth/login",
        { email: values.email, password: values.password },
        { auth: false },
      );
      setAuth(data.user, data.token);
      toast.success("Signed in.");
      router.replace(redirectAfterLogin(data.user.role));
    } catch (e) {
      applyApiError(e, setError);
    }
  };

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface/40 p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface">
            <ShieldCheck className="h-6 w-6 text-content" />
          </span>
          <h1 className="text-xl font-semibold">FoodZone Admin Console</h1>
          <p className="text-sm text-muted">Authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="email" type="email" label="Email" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input id="password" type="password" label="Password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
          {showTwoFactor && (
            <Input id="code" label="2FA code (if enabled)" placeholder="123456" inputMode="numeric" error={errors.code?.message} {...register("code")} />
          )}
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            Sign in
          </Button>
        </form>
      </div>
    </main>
  );
}
