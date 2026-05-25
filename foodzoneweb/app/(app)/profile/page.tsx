"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { useUpdateProfile } from "@/lib/hooks/use-profile";
import { toast } from "@/lib/toast-store";
import { BadgeCheck, ChevronRight, LogOut, Mail, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth(); // guaranteed non-null
  const updateProfile = useUpdateProfile();
  const [editingAvatar, setEditingAvatar] = useState(false);

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

          <div className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Mail className="h-4 w-4" />
            {user.email}
            {!user.email_verified && (
              <span className="rounded bg-warning/15 px-1.5 py-0.5 text-xs text-warning">Unverified</span>
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

        <Link
          href="/addresses"
          className="flex items-center gap-3 rounded-card border border-line bg-bg-soft p-4 hover:bg-surface"
        >
          <MapPin className="h-5 w-5 text-muted" />
          <span className="flex-1 text-sm font-medium">Delivery addresses</span>
          <ChevronRight className="h-4 w-4 text-muted" />
        </Link>

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
