"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PageHeader } from "@/components/ui/PageHeader";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useLoyalty } from "@/lib/hooks/use-loyalty";
import { useUpdateProfile } from "@/lib/hooks/use-profile";
import { toast } from "@/lib/toast-store";
import { BadgeCheck, Bike, ChevronRight, LogOut, Mail, MapPin, Settings, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth(); // guaranteed non-null
  const updateProfile = useUpdateProfile();
  const [editingAvatar, setEditingAvatar] = useState(false);
  const [resending, setResending] = useState(false);

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent — check your inbox.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send verification email.");
    } finally {
      setResending(false);
    }
  };

  const stats = [
    { label: "Posts", value: user.profile?.posts_count ?? 0 },
    { label: "Followers", value: user.profile?.followers_count ?? 0 },
    { label: "Following", value: user.profile?.following_count ?? 0 },
  ];

  const saveAvatar = async (url: string | null) => {
    try {
      await updateProfile.mutateAsync({ avatar: url });
      toast.success(url ? "Avatar updated" : "Avatar removed");
    } catch {
      toast.error("Could not update avatar.");
    }
  };

  return (
    <>
      <PageHeader title="Profile" />

      <div className="mx-auto w-full max-w-2xl space-y-4 p-4">
        <div className="rounded-card border border-line bg-bg-soft p-6">
          <div className="flex items-center gap-4">
            <Avatar src={user.profile?.avatar} name={user.name} size={72} />
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-1.5 text-xl font-semibold">
                {user.name}
                {user.email_verified && <BadgeCheck className="h-5 w-5 text-info" />}
              </h2>
              <p className="text-sm text-muted">@{user.username}</p>
              <span className="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-xs capitalize text-muted">
                {user.role}
              </span>
            </div>
            <button onClick={() => setEditingAvatar((v) => !v)} className="text-sm text-brand hover:underline">
              {editingAvatar ? "Done" : "Edit photo"}
            </button>
          </div>

          {editingAvatar && (
            <div className="mt-4 border-t border-line pt-4">
              <ImageUpload value={user.profile?.avatar ?? null} onChange={saveAvatar} category="avatar" rounded label="Upload avatar" />
            </div>
          )}

          {user.profile?.bio && <p className="mt-4 text-sm text-content">{user.profile.bio}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted">
            <Mail className="h-4 w-4" />
            {user.email}
            {!user.email_verified && (
              <>
                <span className="rounded bg-warning/15 px-1.5 py-0.5 text-xs text-warning">Unverified</span>
                <button
                  onClick={resendVerification}
                  disabled={resending}
                  className="text-xs font-medium text-brand hover:underline disabled:opacity-60"
                >
                  {resending ? "Sending…" : "Resend verification email"}
                </button>
              </>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-5">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <LoyaltyCard />

        <ProfileDetailsForm />

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-4 hover:bg-surface"
        >
          <Settings className="h-5 w-5 text-muted" />
          <span className="flex-1 text-sm font-medium">Settings</span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Link>

        <Link
          href="/addresses"
          className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-4 hover:bg-surface"
        >
          <MapPin className="h-5 w-5 text-muted" />
          <span className="flex-1 text-sm font-medium">Delivery addresses</span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Link>

        {(user.role === "user" || user.role === "delivery") && (
          <Link
            href="/delivery"
            className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-4 hover:bg-surface"
          >
            <Bike className="h-5 w-5 text-muted" />
            <span className="flex-1 text-sm font-medium">
              {user.role === "delivery" ? "Delivery dashboard" : "Become a delivery partner"}
            </span>
            <ChevronRight className="h-4 w-4 text-muted" />
          </Link>
        )}

        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <LogOut className="h-4 w-4" /> Log out
        </Button>
      </div>
    </>
  );
}

const TIER_STYLES: Record<string, { ring: string; text: string; pip: string; label: string }> = {
  bronze: { ring: "ring-orange-700/40", text: "text-orange-700", pip: "bg-orange-700", label: "Bronze" },
  silver: { ring: "ring-zinc-400/50", text: "text-zinc-400", pip: "bg-zinc-400", label: "Silver" },
  gold: { ring: "ring-yellow-500/50", text: "text-yellow-500", pip: "bg-yellow-500", label: "Gold" },
  platinum: { ring: "ring-cyan-400/50", text: "text-cyan-400", pip: "bg-cyan-400", label: "Platinum" },
};

function LoyaltyCard() {
  const { data, isLoading } = useLoyalty();
  if (isLoading || !data) {
    return <div className="h-32 rounded-card bg-bg-soft" />;
  }
  const tier = TIER_STYLES[data.tier] ?? TIER_STYLES.bronze;
  const unlocked = data.badges.filter((b) => b.unlocked);
  const next = data.next_tier;

  return (
    <div className="rounded-card border border-line bg-bg-soft p-5">
      <div className="flex items-center gap-3">
        <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-bg ring-4 ${tier.ring}`}>
          <Sparkles className={`h-5 w-5 ${tier.text}`} />
        </span>
        <div className="flex-1">
          <p className={`text-sm font-medium uppercase tracking-wide ${tier.text}`}>{tier.label}</p>
          <p className="text-2xl font-semibold">{data.points.toLocaleString()} pts</p>
        </div>
        <Link href="/leaderboard" className="text-xs text-muted hover:text-content">Leaderboard →</Link>
      </div>

      {next && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>{next.points_to_go.toLocaleString()} pts to {TIER_STYLES[next.name]?.label ?? next.name}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg">
            <div className={`h-full ${tier.pip}`} style={{ width: `${Math.min(100, Math.round(100 * data.lifetime_points / (data.lifetime_points + next.points_to_go)))}%` }} />
          </div>
        </div>
      )}

      {unlocked.length > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Badges earned</p>
          <div className="flex flex-wrap gap-2">
            {unlocked.map((b) => (
              <span key={b.key} className="flex items-center gap-1 rounded-full border border-line bg-bg px-2.5 py-1 text-xs">
                <Sparkles className="h-3 w-3 text-brand" />
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileDetailsForm() {
  const { user } = useAuth();
  const update = useUpdateProfile();
  const [bio, setBio] = useState(user.profile?.bio ?? "");
  const [location, setLocation] = useState(user.profile?.location ?? "");
  const [website, setWebsite] = useState(user.profile?.website ?? "");
  const [isPrivate, setIsPrivate] = useState(!!user.profile?.is_private);

  const save = async () => {
    try {
      await update.mutateAsync({
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim() || undefined,
        is_private: isPrivate,
      });
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not save.");
    }
  };

  return (
    <div className="rounded-card border border-line bg-bg-soft p-4">
      <h3 className="mb-3 text-sm font-semibold">About you</h3>
      <div className="space-y-3">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          placeholder="Tell people what you love eating…"
          rows={3}
          className="w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="City"
          maxLength={100}
          className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://your.site"
          maxLength={255}
          className="h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="accent-brand" />
          Make my account private
        </label>
        <Button onClick={save} loading={update.isPending}>
          Save changes
        </Button>
      </div>
    </div>
  );
}
