"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { applyApiError } from "@/lib/form-errors";
import { toast } from "@/lib/toast-store";
import type { AuthPayload } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Store } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

const schema = z.object({
  owner_name: z.string().min(1, "Owner name is required.").max(255),
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "At least 8 characters."),
  business_name: z.string().min(1, "Business name is required.").max(255),
  business_type: z.string().min(1, "Select a business type."),
  contact_phone: z.string().min(6, "Enter a contact phone.").max(20),
  address: z.string().min(1, "Address is required.").max(255),
  city: z.string().min(1, "City is required.").max(100),
  description: z.string().max(2000).optional().or(z.literal("")),
  tax_id: z.string().max(255).optional().or(z.literal("")),
  business_license: z.string().max(255).optional().or(z.literal("")),
  bank_account: z.string().max(255).optional().or(z.literal("")),
  agree: z.literal(true, { message: "You must accept the vendor terms." }),
});
type FormValues = z.infer<typeof schema>;

const BUSINESS_TYPES = ["Restaurant", "Cloud Kitchen", "Bakery", "Cafe", "Food Truck", "Other"];

/** Build a valid, unique-ish username from the email local part. */
function deriveUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^A-Za-z0-9_.]/g, "").slice(0, 20) || "vendor";
  return `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function VendorRegisterPage() {
  const { setAuth } = useAuthStore();
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (v: FormValues) => {
    try {
      // 1) Create the owner's account, 2) submit the vendor application.
      const { data } = await api.post<AuthPayload>(
        "/auth/register",
        {
          name: v.owner_name,
          username: deriveUsername(v.email),
          email: v.email,
          password: v.password,
          password_confirmation: v.password,
          phone: v.contact_phone,
        },
        { auth: false },
      );
      setAuth(data.user, data.token);

      await api.post("/vendors/register", {
        name: v.business_name,
        description: v.description ? `[${v.business_type}] ${v.description}` : `[${v.business_type}]`,
        contact_phone: v.contact_phone,
        contact_email: v.email,
        address: v.address,
        city: v.city,
        tax_id: v.tax_id || undefined,
        business_license: v.business_license || undefined,
        bank_account: v.bank_account || undefined,
      });

      setDone(true);
    } catch (e) {
      applyApiError(e, setError);
      if (e instanceof ApiError) toast.error(e.message);
    }
  };

  if (done) {
    return (
      <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-line bg-bg-soft/80 p-8 shadow-lg backdrop-blur-xl text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">Application received</h1>
          <p className="mt-2 text-sm text-muted">
            Thanks for applying to FoodZone! Our team reviews new stores within <b>1–2 business days</b>.
            You&apos;ll be notified once approved, and your dashboard will unlock automatically.
          </p>
          <Link href="/vendor/login">
            <Button className="mt-6 w-full">Go to Vendor Portal</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="fz-hero flex min-h-dvh flex-1 items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Benefits panel (desktop) */}
        <aside className="hidden flex-col justify-center gap-6 rounded-2xl border border-warning/30 bg-gradient-to-br from-warning/10 to-transparent p-8 lg:flex">
          <Store className="h-10 w-10 text-warning" />
          <h2 className="text-3xl font-bold leading-tight">Partner with FoodZone</h2>
          <p className="text-muted">Join thousands of restaurants growing with us.</p>
          <ul className="space-y-3 text-sm">
            {["Free setup — no upfront cost", "Real-time orders & analytics", "Grow your customer base", "Fast, reliable payouts"].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-warning" /> {b}
              </li>
            ))}
          </ul>
          <div className="flex gap-6 border-t border-line pt-4 text-center">
            <div>
              <p className="text-2xl font-bold text-warning">2,000+</p>
              <p className="text-xs text-muted">Partner stores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">1M+</p>
              <p className="text-xs text-muted">Orders delivered</p>
            </div>
          </div>
        </aside>

        {/* Form */}
        <div className="rounded-2xl border border-line bg-bg-soft/80 p-8 shadow-lg backdrop-blur-xl">
          <h1 className="text-xl font-semibold">Create your vendor account</h1>
          <p className="mb-6 text-sm text-muted">Tell us about your business.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Input id="owner_name" label="Owner name" error={errors.owner_name?.message} {...register("owner_name")} />
            <Input id="business_name" label="Business name" error={errors.business_name?.message} {...register("business_name")} />
            <Input id="email" type="email" label="Email" autoComplete="email" error={errors.email?.message} {...register("email")} />
            <Input id="password" type="password" label="Password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
            <Input id="contact_phone" label="Phone" error={errors.contact_phone?.message} {...register("contact_phone")} />
            <div>
              <label htmlFor="business_type" className="mb-1 block text-xs text-muted">Business type</label>
              <select
                id="business_type"
                {...register("business_type")}
                className="h-11 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              >
                <option value="">Select…</option>
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.business_type && <p className="mt-1 text-xs text-danger">{errors.business_type.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Input id="address" label="Business address" error={errors.address?.message} {...register("address")} />
            </div>
            <Input id="city" label="City" error={errors.city?.message} {...register("city")} />
            <Input id="tax_id" label="GST / Tax ID (optional)" error={errors.tax_id?.message} {...register("tax_id")} />
            <Input id="business_license" label="License no. (optional)" error={errors.business_license?.message} {...register("business_license")} />
            <Input id="bank_account" label="Bank account (optional)" error={errors.bank_account?.message} {...register("bank_account")} />
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1 block text-xs text-muted">About your business (optional)</label>
              <textarea
                id="description"
                rows={3}
                {...register("description")}
                className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
              />
            </div>

            <label className="flex items-start gap-2 text-sm text-muted sm:col-span-2">
              <input type="checkbox" {...register("agree")} className="mt-0.5 accent-brand" />
              <span>
                I agree to the FoodZone <span className="text-brand">Vendor Terms</span> and Privacy Policy.
                {errors.agree && <span className="block text-xs text-danger">{errors.agree.message}</span>}
              </span>
            </label>

            <Button type="submit" size="lg" className="sm:col-span-2" loading={isSubmitting}>
              Submit application
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            Already a partner?{" "}
            <Link href="/vendor/login" className="font-medium text-warning hover:underline">
              Vendor login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
