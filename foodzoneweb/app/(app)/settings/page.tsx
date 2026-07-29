"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useDeactivateAccount, useRequestAccountDeletion } from "@/lib/hooks/use-profile";
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
  Trash2,
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
  const requestDeletion = useRequestAccountDeletion();
  const [deleting, setDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

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

  const onRequestDeletion = async () => {
    if (!deletePassword) {
      toast.error("Enter your password to confirm.");
      return;
    }
    try {
      await requestDeletion.mutateAsync(deletePassword);
      await logout();
      toast.success("Deletion requested — log back in within 30 days to cancel it.");
      router.replace("/login");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not process request.");
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

          <div className="border-t border-danger/20 pt-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-danger">
              <Trash2 className="h-4 w-4" />
              Delete my account
            </div>
            <p className="mb-3 text-sm text-muted">
              Permanently deletes your account and data. You have <strong>30 days</strong> to change your mind —
              logging back in during that window cancels the deletion.
            </p>
            {!deleting ? (
              <Button variant="danger" onClick={() => setDeleting(true)}>
                Delete my account
              </Button>
            ) : (
              <div className="space-y-2">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-danger/60"
                />
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => { setDeleting(false); setDeletePassword(""); }}>
                    Cancel
                  </Button>
                  <Button variant="danger" loading={requestDeletion.isPending} onClick={onRequestDeletion}>
                    Permanently delete my account
                  </Button>
                </div>
              </div>
            )}
          </div>
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
