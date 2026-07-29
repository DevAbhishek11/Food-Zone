import { getToken } from "./token";

/**
 * Lazily build a Laravel Echo client for Reverb — ONLY when realtime is
 * configured (NEXT_PUBLIC_REVERB_KEY) and running in the browser. Returns null
 * otherwise, so the app silently falls back to polling. Echo/pusher-js are
 * dynamically imported so they never run during SSR/build.
 */
interface EchoChannel {
  listen: (event: string, cb: (data: unknown) => void) => EchoChannel;
}
interface EchoLike {
  private: (channel: string) => EchoChannel;
  channel: (channel: string) => EchoChannel;
  leave: (channel: string) => void;
}

let echoPromise: Promise<EchoLike | null> | null = null;

function apiOrigin(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
  return base.replace(/\/api\/v1\/?$/, "");
}

export function realtimeEnabled(): boolean {
  return typeof window !== "undefined" && !!process.env.NEXT_PUBLIC_REVERB_KEY;
}

export async function getEcho(): Promise<EchoLike | null> {
  if (!realtimeEnabled()) return null;

  if (!echoPromise) {
    echoPromise = (async () => {
      const [{ default: Echo }, Pusher] = await Promise.all([import("laravel-echo"), import("pusher-js")]);
      (window as unknown as { Pusher: unknown }).Pusher = Pusher.default;

      return new Echo({
        broadcaster: "reverb",
        key: process.env.NEXT_PUBLIC_REVERB_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST ?? window.location.hostname,
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080),
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT ?? 443),
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
        enabledTransports: ["ws", "wss"],
        authEndpoint: `${apiOrigin()}/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${getToken() ?? ""}` } },
      }) as unknown as EchoLike;
    })();
  }
  return echoPromise;
}
