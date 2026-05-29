"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ErrorState } from "@/components/ui/States";
import {
  type NotificationChannel,
  type NotificationPrefMatrix,
  useNotificationPreferences,
  useSaveNotificationPreferences,
} from "@/lib/hooks/use-notifications";
import { toast } from "@/lib/toast-store";
import Link from "next/link";
import { useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  like: "Likes",
  comment: "Comments",
  follow: "Follows",
  mention: "Mentions",
  order_status: "Order status",
  system: "System announcements",
  story_mention: "Story mentions",
  post_tagged: "Tagged in posts",
  vendor_offer: "Vendor offers",
  flash_deal: "Flash deals",
};

const CHANNELS: NotificationChannel[] = ["push", "email", "in_app"];
const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: "Push",
  email: "Email",
  in_app: "In-app",
};

type ChangeMap = Record<string, Partial<Record<NotificationChannel, boolean>>>;

export default function PreferencesPage() {
  const { data, isLoading, isError, refetch } = useNotificationPreferences();
  const save = useSaveNotificationPreferences();
  // Sparse overrides — empty until the user flips a toggle. Avoids the
  // setState-in-effect lint rule from the React Compiler.
  const [changes, setChanges] = useState<ChangeMap>({});

  const merged: NotificationPrefMatrix | null = data
    ? Object.fromEntries(
        Object.entries(data).map(([type, channels]) => [
          type,
          { ...channels, ...(changes[type] ?? {}) } as Record<NotificationChannel, boolean>,
        ]),
      )
    : null;

  const toggle = (type: string, channel: NotificationChannel) => {
    if (!merged) return;
    const current = merged[type][channel];
    setChanges((prev) => ({ ...prev, [type]: { ...(prev[type] ?? {}), [channel]: !current } }));
  };

  const persist = async () => {
    if (!data) return;
    const payload: { type: string; channel: NotificationChannel; enabled: boolean }[] = [];
    for (const [type, channelMap] of Object.entries(changes)) {
      for (const [channel, enabled] of Object.entries(channelMap) as [NotificationChannel, boolean][]) {
        if (data[type]?.[channel] !== enabled) {
          payload.push({ type, channel, enabled });
        }
      }
    }
    if (payload.length === 0) {
      toast.info("Nothing to save.");
      return;
    }
    try {
      await save.mutateAsync(payload);
      setChanges({});
      toast.success(`Saved ${payload.length} change${payload.length === 1 ? "" : "s"}.`);
    } catch {
      toast.error("Could not save preferences.");
    }
  };

  return (
    <>
      <PageHeader
        title="Notification preferences"
        subtitle="Choose how each kind of notification reaches you"
        action={
          <Link href="/notifications" className="text-sm text-muted hover:text-content">
            Back to inbox
          </Link>
        }
      />

      <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
        {isError && <ErrorState message="Couldn't load preferences." onRetry={() => refetch()} />}

        {(isLoading || !merged) && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-card bg-bg-soft" />
            ))}
          </div>
        )}

        {merged && (
          <>
            <div className="overflow-hidden rounded-card border border-line bg-bg-soft">
              <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-line px-4 py-3 text-xs font-semibold uppercase text-muted">
                <span>Type</span>
                {CHANNELS.map((c) => (
                  <span key={c} className="w-16 text-center">{CHANNEL_LABELS[c]}</span>
                ))}
              </div>
              {Object.keys(merged).map((type) => (
                <div key={type} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-4 border-b border-line/60 px-4 py-3 last:border-b-0">
                  <span className="text-sm font-medium">{TYPE_LABELS[type] ?? type}</span>
                  {CHANNELS.map((c) => (
                    <label key={c} className="flex w-16 cursor-pointer items-center justify-center">
                      <input
                        type="checkbox"
                        checked={merged[type][c]}
                        onChange={() => toggle(type, c)}
                        className="h-5 w-5 accent-brand"
                      />
                    </label>
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button onClick={persist} loading={save.isPending}>Save preferences</Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
