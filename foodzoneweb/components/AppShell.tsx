"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/lib/auth-store";
import { useChatUnread } from "@/lib/hooks/use-chat";
import { useUnreadCount } from "@/lib/hooks/use-notifications";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { Bell, Bike, Home, LayoutDashboard, LogOut, MessageCircle, Receipt, Shield, Store, UserRound, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badgeKey?: "notif" | "chat";
}

const BASE_NAV: NavItem[] = [
  { href: "/feed", label: "Feed", icon: Home },
  { href: "/vendors", label: "Order Food", icon: Store },
  { href: "/messages", label: "Messages", icon: MessageCircle, badgeKey: "chat" },
  { href: "/notifications", label: "Inbox", icon: Bell, badgeKey: "notif" },
  { href: "/orders", label: "My Orders", icon: Receipt },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const VENDOR_NAV: NavItem = { href: "/vendor", label: "My Store", icon: LayoutDashboard };
const ADMIN_NAV: NavItem = { href: "/admin", label: "Admin", icon: Shield };
const DELIVERY_NAV: NavItem = { href: "/delivery", label: "Deliveries", icon: Bike };

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + "/");
}

function Count({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-white">
      {n > 99 ? "99+" : n}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: unread = 0 } = useUnreadCount();
  const { data: chatUnread = 0 } = useChatUnread();
  useRealtime(user?.id);

  const countFor = (key?: "notif" | "chat") => (key === "chat" ? chatUnread : key === "notif" ? unread : 0);

  const role = user?.role;
  const NAV: NavItem[] = [
    ...BASE_NAV,
    ...(role === "vendor" ? [VENDOR_NAV] : []),
    ...(role === "delivery" ? [DELIVERY_NAV] : []),
    ...(role === "admin" || role === "super_admin" ? [ADMIN_NAV] : []),
  ];

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg-soft p-4 md:flex">
        <Link href="/feed" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold">FoodZone</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, badgeKey }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive(pathname, href)
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:bg-surface hover:text-content",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
              <Count n={countFor(badgeKey)} />
            </Link>
          ))}
        </nav>

        {user && (
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <Avatar src={user.profile?.avatar} name={user.name} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
            </div>
            <button onClick={handleLogout} aria-label="Log out" className="text-muted hover:text-danger">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">{children}</div>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-bg-soft md:hidden">
        {NAV.map(({ href, label, icon: Icon, badgeKey }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              isActive(pathname, href) ? "text-brand" : "text-muted",
            )}
          >
            <Icon className="h-5 w-5" />
            {countFor(badgeKey) > 0 && (
              <span className="absolute right-1/2 top-1.5 translate-x-3 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
                {countFor(badgeKey) > 99 ? "99+" : countFor(badgeKey)}
              </span>
            )}
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
