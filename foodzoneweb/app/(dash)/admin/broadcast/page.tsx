"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ApiError } from "@/lib/api";
import { useBroadcast } from "@/lib/hooks/use-admin-v3";
import { toast } from "@/lib/toast-store";
import { Megaphone } from "lucide-react";
import { useState } from "react";

const SEGMENTS = [
  { value: "all", label: "All users" },
  { value: "users", label: "Customers only" },
  { value: "vendors", label: "Vendors only" },
  { value: "verified", label: "Verified users" },
];

export default function AdminBroadcastPage() {
  const broadcast = useBroadcast();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [segment, setSegment] = useState("all");

  const send = async () => {
    const t = title.trim();
    const m = message.trim();
    if (!t || !m) return;
    if (!confirm(`Send to ${SEGMENTS.find((s) => s.value === segment)?.label}?`)) return;

    try {
      const res = await broadcast.mutateAsync({ title: t, message: m, segment });
      toast.success(`Sent to ${res.data.recipients} ${res.data.recipients === 1 ? "person" : "people"}.`);
      setTitle("");
      setMessage("");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not send.");
    }
  };

  return (
    <>
      <PageHeader title="Platform broadcast" subtitle="Send a system notification to many users at once" />

      <div className="mx-auto grid w-full max-w-4xl gap-6 p-4 md:grid-cols-[1fr_320px] md:p-6">
        {/* Composer */}
        <div className="rounded-card border border-line bg-bg-soft p-6">
          <label className="block text-xs font-medium uppercase text-muted">Audience</label>
          <select
            value={segment}
            onChange={(e) => setSegment(e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <label className="mt-4 block text-xs font-medium uppercase text-muted">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="What's the announcement?"
            className="mt-1 h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          />

          <label className="mt-4 block text-xs font-medium uppercase text-muted">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            maxLength={500}
            placeholder="Keep it short and useful. Users see this as a system notification."
            className="mt-1 w-full resize-none rounded-lg border border-line bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
          />
          <p className="mt-1 text-right text-xs text-muted">{message.length}/500</p>

          <Button
            onClick={send}
            loading={broadcast.isPending}
            disabled={!title.trim() || !message.trim()}
            className="mt-4 w-full"
            size="lg"
            leftIcon={<Megaphone className="h-4 w-4" />}
          >
            Send broadcast
          </Button>
        </div>

        {/* Preview */}
        <aside className="space-y-3">
          <p className="text-xs font-medium uppercase text-muted">Preview</p>
          <div className="rounded-card border border-line bg-bg-soft p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                <Megaphone className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold">{title || "Title goes here"}</p>
                <p className="mt-0.5 text-sm text-muted">{message || "Your message preview."}</p>
                <p className="mt-2 text-xs text-muted">Just now · FoodZone</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted">⚠ This is permanent — there&apos;s no recall once sent.</p>
        </aside>
      </div>
    </>
  );
}
