"use client";

import { Button } from "@/components/ui/Button";
import { getToken } from "@/lib/token";
import {
  ArrowRight,
  AtSign,
  Bike,
  MessageCircle,
  Play,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CATEGORIES = ["Biryani", "Pizza", "Burgers", "Sushi", "Desserts", "Coffee", "Tacos", "Noodles", "Salads", "Wraps"];

export default function LandingPage() {
  const router = useRouter();

  // Already signed in? Skip the marketing page.
  useEffect(() => {
    if (getToken()) router.replace("/feed");
  }, [router]);

  return (
    <div className="min-h-dvh bg-bg text-content">
      <TopNav />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <TrendingFood />
      <AppDownload />
      <VendorCta />
      <Footer />
    </div>
  );
}

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/60 bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold">FoodZone</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button size="sm">Get Started</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="fz-hero relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-16">
      {/* floating food emoji */}
      <div className="pointer-events-none absolute inset-0 select-none">
        <span className="fz-float absolute left-[12%] top-[28%] text-5xl opacity-30">🍕</span>
        <span className="fz-float absolute right-[15%] top-[22%] text-5xl opacity-30" style={{ animationDelay: "1.5s" }}>🍔</span>
        <span className="fz-float absolute left-[20%] bottom-[20%] text-5xl opacity-30" style={{ animationDelay: "3s" }}>🍜</span>
        <span className="fz-float absolute right-[22%] bottom-[24%] text-5xl opacity-30" style={{ animationDelay: "2.2s" }}>🍰</span>
      </div>

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-xs font-medium text-brand">
          🎉 Now serving 2,000+ restaurants
        </span>
        <h1 className="mt-6 text-5xl font-extrabold leading-tight sm:text-6xl md:text-7xl">
          Where <span className="fz-gradient-text">Food</span> Meets <span className="fz-gradient-text">Community</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
          Order from local restaurants. Share your food journey. Connect with food lovers.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register">
            <Button size="lg" className="w-full sm:w-auto">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Order Food Now
            </Button>
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted">
          50,000+ orders delivered · 2,000+ restaurants · 100,000+ food lovers
        </p>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: "🍔", title: "Order Food", desc: "Browse 2000+ restaurants, real-time tracking, instant delivery." },
  { icon: "📱", title: "Social Feed", desc: "Share food posts, follow foodies, discover trending restaurants." },
  { icon: "💬", title: "Connect", desc: "Chat with friends, share recommendations, build your food community." },
];

function Features() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <h2 className="text-center text-3xl font-bold sm:text-4xl">Everything you love, in one app</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="group rounded-2xl border border-line p-8 backdrop-blur-xl transition-transform duration-200 hover:-translate-y-1 hover:border-brand/40"
            style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))" }}
          >
            <div className="text-4xl transition-transform duration-200 group-hover:scale-110">{f.icon}</div>
            <h3 className="mt-4 text-xl font-semibold">{f.title}</h3>
            <p className="mt-2 text-muted">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const STEPS = [
  { n: 1, title: "Create your account", desc: "Sign up in 30 seconds — no card required." },
  { n: 2, title: "Discover restaurants near you", desc: "Browse menus, ratings, and trending dishes." },
  { n: 3, title: "Order & track in real-time", desc: "Watch your food go from kitchen to door." },
  { n: 4, title: "Share with the community", desc: "Post your meal, review, and follow other foodies." },
];

function HowItWorks() {
  return (
    <section className="border-y border-line bg-bg-soft/40 px-4 py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold sm:text-4xl">How it works</h2>
        <ol className="relative mt-12 space-y-10 border-l border-line pl-8">
          {STEPS.map((s) => (
            <li key={s.n} className="relative">
              <span className="absolute -left-[2.45rem] flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {s.n}
              </span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="text-muted">{s.desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { to: 50, suffix: "K+", label: "Happy Customers" },
    { to: 2, suffix: "K+", label: "Partner Restaurants" },
    { to: 1, suffix: "M+", label: "Orders Delivered" },
    { to: 4.9, suffix: "★", label: "Average Rating", decimals: 1 },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      <div
        className="rounded-3xl border border-brand/40 p-12"
        style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.12), rgba(255,64,129,0.05))" }}
      >
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StatCounter({ to, suffix, label, decimals = 0 }: { to: number; suffix: string; label: string; decimals?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const duration = 1400;
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / duration);
            setValue(to * (1 - Math.pow(1 - p, 3))); // ease-out cubic
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [to]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl font-extrabold text-brand sm:text-5xl">
        {value.toFixed(decimals)}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

function TrendingFood() {
  return (
    <section className="px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-2xl font-bold">Trending right now</h2>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              href={`/vendors?category=${encodeURIComponent(c)}`}
              className="shrink-0 rounded-full border border-line bg-surface px-5 py-2 text-sm font-medium text-content transition-colors hover:border-brand/40 hover:text-brand"
            >
              {c}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AppDownload() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-24 md:grid-cols-2">
      <div>
        <h2 className="text-3xl font-bold sm:text-4xl">Take FoodZone anywhere</h2>
        <p className="mt-4 text-muted">Order, post, and chat on the go. Available on iOS and Android.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="https://apps.apple.com/?utm_source=foodzone-web&utm_medium=landing" className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium transition-colors hover:border-brand/40">
             App Store
          </a>
          <a href="https://play.google.com/store?utm_source=foodzone-web&utm_medium=landing" className="rounded-xl border border-line bg-surface px-5 py-3 text-sm font-medium transition-colors hover:border-brand/40">
            ▶ Google Play
          </a>
        </div>
      </div>
      {/* CSS-drawn phone mockup */}
      <div className="flex justify-center">
        <div className="fz-float h-[420px] w-[210px] rounded-[2.5rem] border-4 border-surface bg-bg-soft p-3 shadow-2xl">
          <div className="flex h-full flex-col gap-2 overflow-hidden rounded-[1.8rem] bg-bg p-3">
            <div className="h-24 rounded-xl" style={{ background: "linear-gradient(135deg, #ff6b35, #ff4081)" }} />
            <div className="h-3 w-2/3 rounded-full bg-surface" />
            <div className="h-3 w-1/2 rounded-full bg-surface" />
            <div className="mt-2 h-20 rounded-xl bg-surface" />
            <div className="h-20 rounded-xl bg-surface" />
          </div>
        </div>
      </div>
    </section>
  );
}

function VendorCta() {
  return (
    <section className="px-4 py-20">
      <div
        className="mx-auto max-w-5xl rounded-3xl border border-brand/40 p-12 text-center"
        style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.15), rgba(139,92,246,0.08))" }}
      >
        <Store className="mx-auto h-10 w-10 text-brand" />
        <h2 className="mt-4 text-3xl font-bold sm:text-4xl">Are you a restaurant owner?</h2>
        <p className="mt-3 text-muted">Join 2,000+ vendors already growing on FoodZone.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm text-muted">
          <span>✓ Free setup</span>
          <span>✓ Real-time analytics</span>
          <span>✓ Grow your customer base</span>
        </div>
        <Link href="/vendor/register">
          <Button size="lg" className="mt-6">
            Start selling today <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </span>
            <span className="font-bold">FoodZone</span>
          </div>
          <p className="mt-3 text-sm text-muted">Where food meets community.</p>
          <div className="mt-4 flex gap-3 text-muted">
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-content"><AtSign className="h-5 w-5" /></a>
            <a href="https://youtube.com" aria-label="YouTube" className="hover:text-content"><Play className="h-5 w-5" /></a>
            <a href="https://twitter.com" aria-label="Social" className="hover:text-content"><MessageCircle className="h-5 w-5" /></a>
          </div>
        </div>
        <FooterCol title="Company" links={[["About", "/"], ["Careers", "/"], ["Blog", "/"], ["Press", "/"]]} />
        <FooterCol
          title="For Vendors"
          links={[["Partner with us", "/vendor/register"], ["Vendor Login", "/vendor/login"], ["Vendor Register", "/vendor/register"]]}
        />
        <FooterCol title="Legal" links={[["Terms", "/"], ["Privacy Policy", "/"], ["Cookie Policy", "/"]]} />
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-muted md:text-left">
        © {new Date().getFullYear()} FoodZone. Made with <Bike className="inline h-3 w-3" /> for food lovers.
      </p>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-content">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
