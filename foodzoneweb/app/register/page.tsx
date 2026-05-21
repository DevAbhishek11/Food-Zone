"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { applyApiError } from "@/lib/form-errors";
import { toast } from "@/lib/toast-store";
import type { AuthPayload } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Passwords do not match.",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, status } = useAuthStore();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { data } = await api.post<AuthPayload>("/auth/register", values, { auth: false });
      setAuth(data.user, data.token);
      toast.success("Account created! Check your email to verify.");
      router.replace("/");
    } catch (e) {
      applyApiError(e, setError);
    }
  };

  return (
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand">
            <UtensilsCrossed className="h-6 w-6 text-white" />
          </span>
          <h1 className="text-2xl font-semibold">Join FoodZone</h1>
          <p className="text-sm text-muted">Create your free account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input id="name" label="Full name" placeholder="Jane Doe" error={errors.name?.message} {...register("name")} />
          <Input id="username" label="Username" placeholder="janedoe" error={errors.username?.message} {...register("username")} />
          <Input id="email" type="email" label="Email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} {...register("email")} />
          <Input id="password" type="password" label="Password" placeholder="••••••••" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <Input id="password_confirmation" type="password" label="Confirm password" placeholder="••••••••" autoComplete="new-password" error={errors.password_confirmation?.message} {...register("password_confirmation")} />
          <Button type="submit" size="lg" loading={isSubmitting} className="mt-2">
            Create account
          </Button>
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
