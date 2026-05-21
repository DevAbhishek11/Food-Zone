"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/lib/auth-store";
import { useUnreadCount } from "@/lib/hooks/use-notifications";
import { Bell, Home, LogOut, Receipt, Store, UserRound, UtensilsCrossed } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: boolean;
}

const NAV: NavItem[] = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/vendors", label: "Order Food", icon: Store },
  { href: "/notifications", label: "Inbox", icon: Bell, badge: true },
  { href: "/orders", label: "My Orders", icon: Receipt },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
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

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-bg-soft p-4 md:flex">
        <Link href="/" className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
            <UtensilsCrossed className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold">FoodZone</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon, badge }) => (
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
              {badge && <Count n={unread} />}
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
        {NAV.map(({ href, label, icon: Icon, badge }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              isActive(pathname, href) ? "text-brand" : "text-muted",
            )}
          >
            <Icon className="h-5 w-5" />
            {badge && unread > 0 && (
              <span className="absolute right-1/2 top-1.5 translate-x-3 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
