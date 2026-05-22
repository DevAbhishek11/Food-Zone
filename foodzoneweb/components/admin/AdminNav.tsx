"use client";

import { cn } from "@/lib/cn";
import { LayoutDashboard, Receipt, Store, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Receipt },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/vendors", label: "Vendors", icon: Store },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-line px-4 md:px-6">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors",
              active ? "border-brand text-brand" : "border-transparent text-muted hover:text-content",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
