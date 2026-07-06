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
import { ArrowLeft, ArrowRight, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z
  .object({
    name: z.string().min(1, "Your name is required.").max(255),
    username: z
      .string()
      .min(3, "At least 3 characters.")
      .max(50)
      .regex(/^[A-Za-z0-9_.]+$/, "Letters, numbers, _ and . only."),
    email: z.string().email("Enter a valid email."),
    password: z.string().min(8, "At least 8 characters."),
    password_confirmation: z.string(),
    phone: z.string().max(20).optional().or(z.literal("")),
    dob: z.string().optional().or(z.literal("")),
    gender: z.string().optional().or(z.literal("")),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  1: ["name", "username", "email"],
  2: ["password", "password_confirmation", "phone"],
  3: ["dob", "gender"],
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, status, user } = useAuthStore();
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    trigger,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), mode: "onTouched" });

  useEffect(() => {
    if (status === "authenticated") router.replace(redirectAfterLogin(user?.role, user?.onboarding_completed));
  }, [status, user, router]);

  const next = async () => {
    const valid = await trigger(STEP_FIELDS[step]);
    if (valid) setStep((s) => Math.min(3, s + 1));
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthPayload>("/auth/register", values, { auth: false });
      setAuth(data.user, data.token);
      toast.success("Account created! Check your email to verify.");
      router.replace(redirectAfterLogin(data.user.role, data.user.onboarding_completed));
    } catch (e) {
      applyApiError(e, setError);
    }
  };

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft/80 p-8 shadow-lg backdrop-blur-xl">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl fz-gradient-brand shadow-brand">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Join FoodZone</h1>
          <p className="text-sm text-muted">Step {step} of 3</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <span
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand" : "bg-surface"}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          {step === 1 && (
            <>
              <Input id="name" label="Full name" placeholder="Jane Doe" error={errors.name?.message} {...register("name")} />
              <Input id="username" label="Username" placeholder="janedoe" error={errors.username?.message} {...register("username")} />
              <Input id="email" type="email" label="Email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
            </>
          )}

          {step === 2 && (
            <>
              <Input id="password" type="password" label="Password" placeholder="••••••••" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
              <Input id="password_confirmation" type="password" label="Confirm password" placeholder="••••••••" autoComplete="new-password" error={errors.password_confirmation?.message} {...register("password_confirmation")} />
              <Input id="phone" label="Phone (optional)" placeholder="+91 98765 43210" error={errors.phone?.message} {...register("phone")} />
            </>
          )}

          {step === 3 && (
            <>
              <Input id="dob" type="date" label="Date of birth (optional)" error={errors.dob?.message} {...register("dob")} />
              <div>
                <label htmlFor="gender" className="mb-1 block text-xs text-muted">
                  Gender (optional)
                </label>
                <select
                  id="gender"
                  {...register("gender")}
                  className="h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </>
          )}

          <div className="mt-2 flex gap-2">
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < 3 ? (
              <Button type="button" className="flex-1" onClick={next}>
                Continue <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" className="flex-1" loading={isSubmitting}>
                Create account
              </Button>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
