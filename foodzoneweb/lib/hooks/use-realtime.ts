"use client";

import { getEcho } from "@/lib/echo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

/**
 * Subscribes to the current user's private channel and refreshes notification
 * queries in real time. No-op (polling stays the fallback) when Reverb isn't
 * configured. Order channels can subscribe similarly on the orders screen.
 */
export function useRealtime(userId: number | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const channelName = `user.${userId}`;

    getEcho().then((echo) => {
      if (!echo || !active) return;
      echo.private(channelName)
        .listen(".notification.created", () => {
          qc.invalidateQueries({ queryKey: ["notifications"] });
        })
        .listen(".order.status", () => {
          qc.invalidateQueries({ queryKey: ["orders"] });
        });
    });

    return () => {
      active = false;
      getEcho().then((echo) => echo?.leave(channelName));
    };
  }, [userId, qc]);
}
