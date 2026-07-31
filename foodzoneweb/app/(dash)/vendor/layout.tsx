"use client";

import { DashShell, type DashNavGroup } from "@/components/dash/DashShell";
import { StoreStatusCard } from "@/components/vendor/StoreStatusCard";
import { useAuth } from "@/lib/auth-context";
import { Boxes, Clock, LayoutDashboard, ListOrdered, Star, Tag, Users, UtensilsCrossed, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const NAV: DashNavGroup[] = [
  {
    items: [{ href: "/vendor", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/vendor/orders", label: "Orders", icon: ListOrdered },
      { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
      { href: "/vendor/inventory", label: "Inventory", icon: Boxes },
      { href: "/vendor/hours", label: "Operating hours", icon: Clock },
      { href: "/vendor/payouts", label: "Payouts", icon: Wallet },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/vendor/vouchers", label: "Vouchers", icon: Tag },
      { href: "/vendor/reviews", label: "Reviews", icon: Star },
      { href: "/vendor/customers", label: "Customers", icon: Users },
    ],
  },
];

/** Vendor portal shell — restricted to vendor accounts (admins may peek). */
export default function VendorLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = user.role === "vendor" || user.role === "admin" || user.role === "super_admin";

  useEffect(() => {
    if (!allowed) router.replace("/feed");
  }, [allowed, router]);

  if (!allowed) return null;

  return (
    <DashShell brand="Vendor Portal" groups={NAV} sidebarExtra={user.role === "vendor" ? <StoreStatusCard /> : undefined}>
      {children}
    </DashShell>
  );
}
