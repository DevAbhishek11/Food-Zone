import { getToken } from './token';

/**
 * Lazily build a Laravel Echo client for Reverb — ONLY when realtime is
 * configured (EXPO_PUBLIC_REVERB_KEY). Returns null otherwise so the app falls
 * back to polling. Echo/pusher-js are dynamically imported so they are never
 * evaluated unless realtime is actually enabled.
 */
interface EchoChannel {
  listen: (event: string, cb: (data: unknown) => void) => EchoChannel;
}
interface EchoLike {
  private: (channel: string) => EchoChannel;
  leave: (channel: string) => void;
}

let echoPromise: Promise<EchoLike | null> | null = null;

function apiOrigin(): string {
  const base = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';
  return base.replace(/\/api\/v1\/?$/, '');
}

export function realtimeEnabled(): boolean {
  return !!process.env.EXPO_PUBLIC_REVERB_KEY;
}

export async function getEcho(): Promise<EchoLike | null> {
  if (!realtimeEnabled()) return null;

  if (!echoPromise) {
    echoPromise = (async () => {
      const [{ default: Echo }, Pusher] = await Promise.all([import('laravel-echo'), import('pusher-js')]);
      (globalThis as unknown as { Pusher: unknown }).Pusher = Pusher.default;

      return new Echo({
        broadcaster: 'reverb',
        key: process.env.EXPO_PUBLIC_REVERB_KEY,
        wsHost: process.env.EXPO_PUBLIC_REVERB_HOST,
        wsPort: Number(process.env.EXPO_PUBLIC_REVERB_PORT ?? 8080),
        forceTLS: (process.env.EXPO_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: `${apiOrigin()}/broadcasting/auth`,
        auth: { headers: { Authorization: `Bearer ${getToken() ?? ''}` } },
      }) as unknown as EchoLike;
    })();
  }
  return echoPromise;
}
