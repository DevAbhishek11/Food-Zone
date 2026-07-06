"use client";

import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { useAuthStore } from "@/lib/auth-store";
import { useUnreadCount } from "@/lib/hooks/use-notifications";
import { useRealtime } from "@/lib/hooks/use-realtime";
import { ArrowLeft, Bell, LogOut, Menu, UtensilsCrossed, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ComponentType, type ReactNode } from "react";

export interface DashNavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** Match only the exact path (for section index pages like /admin). */
  exact?: boolean;
}

export interface DashNavGroup {
  label?: string;
  items: DashNavItem[];
}

function isActive(pathname: string, item: DashNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + "/");
}

/**
 * Dedicated dashboard chrome for the admin panel and vendor portal:
 * grouped sidebar navigation, notification bell, user block, and a
 * slide-in drawer on mobile. Pages keep their own sticky PageHeader.
 */
export function DashShell({
  brand,
  accent,
  groups,
  sidebarExtra,
  children,
}: {
  /** Small label under the logo, e.g. "Admin Panel". */
  brand: string;
  /** Accent class for the brand chip, e.g. "bg-info" (admin) or "bg-brand" (vendor). */
  accent?: string;
  groups: DashNavGroup[];
  /** Optional widget pinned above the nav (e.g. store status toggle). */
  sidebarExtra?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { data: unread = 0 } = useUnreadCount();
  const [drawerOpen, setDrawerOpen] = useState(false);
  useRealtime(user?.id);

  // Close the mobile drawer on navigation (state-adjust-during-render pattern).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <Link href="/feed" className="flex items-center gap-2.5 px-4 pb-5 pt-5">
        <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accent ?? "bg-brand")}>
          <UtensilsCrossed className="h-5 w-5 text-white" />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-semibold leading-tight tracking-tight">FoodZone</span>
          <span className="block text-[11px] font-medium uppercase tracking-widest text-muted">{brand}</span>
        </span>
      </Link>

      {sidebarExtra && <div className="px-3 pb-4">{sidebarExtra}</div>}

      {/* Nav groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-widest text-text-tertiary">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(pathname, item);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-brand/15 text-brand" : "text-muted hover:bg-surface hover:text-content",
                    )}
                  >
                    {active && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand" />}
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: back to app, bell, user */}
      <div className="border-t border-line px-3 py-3">
        <div className="mb-2 flex items-center gap-1">
          <Link
            href="/feed"
            className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface hover:text-content"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
          <Link
            href="/notifications"
            aria-label="Notifications"
            className="relative rounded-lg p-2 text-muted transition-colors hover:bg-surface hover:text-content"
          >
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </div>
        {user && (
          <div className="flex items-center gap-3 rounded-lg bg-surface/50 px-3 py-2.5">
            <Avatar src={user.profile?.avatar} name={user.name} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
            </div>
            <button onClick={handleLogout} aria-label="Log out" className="text-muted transition-colors hover:text-danger">
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex min-h-dvh">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-bg-soft lg:block">
        {sidebar}
      </aside>

      {/* Drawer (mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-bg-soft shadow-lg">
            <button
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-surface hover:text-content"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-line bg-bg/80 px-4 py-3 backdrop-blur lg:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-content"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-md", accent ?? "bg-brand")}>
              <UtensilsCrossed className="h-3.5 w-3.5 text-white" />
            </span>
            FoodZone <span className="text-muted">· {brand}</span>
          </span>
        </header>

        {children}
      </div>
    </div>
  );
}
