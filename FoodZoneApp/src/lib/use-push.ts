import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { api } from './api';
import { useAuthStore } from './auth-store';

// How notifications behave when received in the foreground (SDK 55 handler shape).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function projectId(): string | undefined {
  const fromExtra = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  const fromEas = (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  return fromExtra ?? fromEas;
}

async function registerForPush(): Promise<void> {
  // Remote push needs a real device + an EAS project; skip silently otherwise
  // (web, simulators, Expo Go on Android from SDK 53, or no projectId configured).
  if (Platform.OS === 'web' || !Device.isDevice) return;
  const id = projectId();
  if (!id) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync();
    granted = requested.granted;
  }
  if (!granted) return;

  const token = await Notifications.getExpoPushTokenAsync({ projectId: id });
  await api.post('/push-tokens', { token: token.data, platform: Platform.OS });
}

/** Registers this device for push notifications once the user is authenticated. */
export function usePushRegistration(): void {
  const status = useAuthStore((s) => s.status);
  const done = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || done.current) return;
    done.current = true;
    registerForPush().catch(() => {
      // Non-fatal: unsupported environment, permission denied, or offline.
      done.current = false;
    });
  }, [status]);
}
