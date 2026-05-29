"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useCompleteOnboarding, useSkipOnboarding } from "@/lib/hooks/use-notifications";
import { useExplore } from "@/lib/hooks/use-explore";
import { useAuthStore } from "@/lib/auth-store";
import { toast } from "@/lib/toast-store";
import { ApiError } from "@/lib/api";
import { Check, ChevronLeft, ChevronRight, MapPin, UtensilsCrossed, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CUISINES = ["Italian", "Thai", "Indian", "Mexican", "Japanese", "Chinese", "American", "Mediterranean", "Korean", "Vietnamese", "French", "Lebanese"];
const DIETS = ["Vegetarian", "Vegan", "Halal", "Kosher", "Gluten-free", "Nut-free", "Dairy-free", "Low-carb"];

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const [step, setStep] = useState(0);

  const [cuisines, setCuisines] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [follows, setFollows] = useState<number[]>([]);

  const explore = useExplore(null);
  const complete = useCompleteOnboarding();
  const skip = useSkipOnboarding();

  // Already done? Bounce to feed.
  useEffect(() => {
    if (user?.onboarding_completed) router.replace("/feed");
  }, [user, router]);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`),
      () => toast.error("Could not get your location."),
      { timeout: 6000 },
    );
  };

  const toggleArr = <T,>(arr: T[], setArr: (a: T[]) => void, value: T) =>
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);

  const finish = async () => {
    try {
      await complete.mutateAsync({
        food_preferences: cuisines.map((c) => c.toLowerCase()),
        dietary_restrictions: diets.map((d) => d.toLowerCase()),
        location: location || undefined,
        follow_user_ids: follows,
      });
      await hydrate();
      toast.success("Welcome to FoodZone!");
      router.replace("/feed");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save.");
    }
  };

  const skipAll = async () => {
    try {
      await skip.mutateAsync();
      await hydrate();
      router.replace("/feed");
    } catch {
      toast.error("Could not skip.");
    }
  };

  const steps = [
    { icon: UtensilsCrossed, title: "What do you love eating?", subtitle: "Pick at least 3 cuisines — we'll show more of what you like." },
    { icon: Users, title: "Any dietary restrictions?", subtitle: "We'll filter menus and search to match. You can change this later." },
    { icon: MapPin, title: "Where are you?", subtitle: "Helps us surface nearby restaurants and accurate delivery times." },
    { icon: Users, title: "Follow a few foodies", subtitle: "Your feed gets better the more people you follow." },
  ];

  const current = steps[step];

  return (
    <div className="flex min-h-dvh items-start justify-center bg-gradient-to-br from-brand/10 via-bg to-bg p-4 md:p-10">
      <div className="w-full max-w-xl rounded-card border border-line bg-bg-soft p-6 md:p-10">
        {/* Progress dots */}
        <div className="mb-6 flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <span key={i} className={cn("h-2 rounded-full transition-all", i === step ? "w-8 bg-brand" : i < step ? "w-2 bg-brand/70" : "w-2 bg-line")} />
          ))}
        </div>

        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
            <current.icon className="h-5 w-5 text-brand" />
          </span>
          <div>
            <h1 className="text-lg font-semibold">{current.title}</h1>
            <p className="text-sm text-muted">{current.subtitle}</p>
          </div>
        </div>

        {step === 0 && (
          <div className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const on = cuisines.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleArr(cuisines, setCuisines, c)}
                  className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand/50")}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {c}
                </button>
              );
            })}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {DIETS.map((d) => {
              const on = diets.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleArr(diets, setDiets, d)}
                  className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors", on ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand/50")}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {d}
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase text-muted">City or neighbourhood</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Indiranagar, Bengaluru"
              className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
            />
            <Button type="button" variant="secondary" onClick={detectLocation} leftIcon={<MapPin className="h-4 w-4" />}>
              Use my current location
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            {explore.isLoading && <p className="text-sm text-muted">Loading suggestions…</p>}
            {explore.data?.suggested_users.length === 0 && (
              <p className="text-sm text-muted">No suggestions yet. You can follow people from anyone&apos;s profile later.</p>
            )}
            {explore.data?.suggested_users.map((s) => {
              const on = follows.includes(s.user.id);
              return (
                <div key={s.user.id} className="flex items-center gap-3 rounded-card border border-line bg-bg p-3">
                  <Avatar src={s.user.avatar} name={s.user.name} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.user.name}</p>
                    <p className="truncate text-xs text-muted">@{s.user.username}</p>
                  </div>
                  <Button size="sm" variant={on ? "ghost" : "primary"} onClick={() => toggleArr(follows, setFollows, s.user.id)}>
                    {on ? "Following" : "Follow"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={skipAll} disabled={skip.isPending || complete.isPending}>
            Skip for now
          </Button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="secondary" onClick={() => setStep((s) => s - 1)} leftIcon={<ChevronLeft className="h-4 w-4" />}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={step === 0 && cuisines.length < 3}
                rightIcon={<ChevronRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button onClick={finish} loading={complete.isPending}>Get started</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
