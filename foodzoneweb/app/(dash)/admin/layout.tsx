"use client";

import { DashShell, type DashNavGroup } from "@/components/dash/DashShell";
import { useAuth } from "@/lib/auth-context";
import { Flag, LayoutDashboard, Megaphone, Receipt, ScrollText, Store, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const NAV: DashNavGroup[] = [
  {
    items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true }],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: Receipt },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/vendors", label: "Vendors", icon: Store },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: Flag },
      { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText },
    ],
  },
];

/** Admin panel shell — restricted to admin/super_admin roles. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const allowed = user.role === "admin" || user.role === "super_admin";

  useEffect(() => {
    if (!allowed) router.replace("/feed");
  }, [allowed, router]);

  if (!allowed) return null;

  return (
    <DashShell brand="Admin Panel" accent="bg-info" groups={NAV}>
      {children}
    </DashShell>
  );
}
