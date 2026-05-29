"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { useDeactivateAccount } from "@/lib/hooks/use-profile";
import { toast } from "@/lib/toast-store";
import {
  Bell,
  ChevronRight,
  ExternalLink,
  Eye,
  Heart,
  Info,
  Lock,
  Mail,
  Receipt,
  Shield,
  Sparkles,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const APP_VERSION = "3.0.0";

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const deactivate = useDeactivateAccount();
  const [confirming, setConfirming] = useState(false);

  const onDeactivate = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    try {
      await deactivate.mutateAsync();
      await logout();
      toast.success("Account deactivated.");
      router.replace("/login");
    } catch {
      toast.error("Could not deactivate. Try again.");
      setConfirming(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Account, privacy, notifications and more" />

      <div className="mx-auto w-full max-w-2xl space-y-6 p-4 md:p-6">
        <Section title="Account">
          <Row href="/profile" icon={Mail} label="Profile details" hint={user.email} />
          <Row href="/addresses" icon={Receipt} label="Delivery addresses" />
          <Row href="/orders" icon={Receipt} label="Order history" />
        </Section>

        <Section title="Privacy">
          <Row href="/profile" icon={Eye} label="Account privacy" hint={user.profile?.is_private ? "Private" : "Public"} />
          <Row href="/favorites" icon={Heart} label="Favorited restaurants" />
        </Section>

        <Section title="Notifications">
          <Row href="/notifications" icon={Bell} label="Inbox" />
          <Row href="/notifications/preferences" icon={Bell} label="Notification preferences" hint="Per-type push/email/in-app" />
        </Section>

        <Section title="Loyalty">
          <Row href="/profile" icon={Sparkles} label="Points & badges" />
          <Row href="/leaderboard" icon={Sparkles} label="Leaderboard" />
        </Section>

        <Section title="About">
          <RowStatic icon={Info} label="App version" hint={APP_VERSION} />
          <RowExternal href="https://foodzone.app/terms" icon={Shield} label="Terms of Service" />
          <RowExternal href="https://foodzone.app/privacy" icon={Lock} label="Privacy Policy" />
          <RowExternal href="mailto:support@foodzone.app" icon={Mail} label="Contact support" />
        </Section>

        <div className="space-y-3 rounded-card border border-danger/40 bg-danger/5 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-danger">
            <UserX className="h-4 w-4" />
            Danger zone
          </div>
          <p className="text-sm text-muted">
            Deactivating hides your profile, posts and reviews. You can sign back in later to restore your account.
          </p>
          <Button
            variant="danger"
            onClick={onDeactivate}
            loading={deactivate.isPending}
          >
            {confirming ? "Tap again to confirm deactivation" : "Deactivate my account"}
          </Button>
        </div>
      </div>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="overflow-hidden rounded-card border border-line bg-bg-soft">{children}</div>
    </section>
  );
}

function Row({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 hover:bg-surface">
      <Icon className="h-5 w-5 text-muted" />
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted" />
    </Link>
  );
}

function RowExternal({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0 hover:bg-surface">
      <Icon className="h-5 w-5 text-muted" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ExternalLink className="h-4 w-4 text-muted" />
    </a>
  );
}

function RowStatic({ icon: Icon, label, hint }: { icon: React.ComponentType<{ className?: string }>; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-line/60 px-4 py-3 last:border-b-0">
      <Icon className="h-5 w-5 text-muted" />
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  );
}
