"use client";

import { cn } from "@/lib/cn";
import { Boxes, Clock, LayoutDashboard, ListOrdered, Star, Tag, Users, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/vendor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/orders", label: "Orders", icon: ListOrdered },
  { href: "/vendor/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/vendor/hours", label: "Hours", icon: Clock },
  { href: "/vendor/customers", label: "Customers", icon: Users },
  { href: "/vendor/inventory", label: "Inventory", icon: Boxes },
  { href: "/vendor/vouchers", label: "Vouchers", icon: Tag },
  { href: "/vendor/reviews", label: "Reviews", icon: Star },
];

export function VendorNav() {
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
