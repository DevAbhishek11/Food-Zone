import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Bearer token persistence. SecureStore on native; localStorage on web.
// An in-memory cache lets the API client read the token synchronously.

const KEY = 'fz_token';
let cached: string | null = null;

export function getToken(): string | null {
  return cached;
}

export async function loadToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    cached = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  } else {
    cached = await SecureStore.getItemAsync(KEY);
  }
  return cached;
}

export async function setToken(token: string): Promise<void> {
  cached = token;
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, token);
  } else {
    await SecureStore.setItemAsync(KEY, token);
  }
}

export async function clearToken(): Promise<void> {
  cached = null;
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(KEY);
  } else {
    await SecureStore.deleteItemAsync(KEY);
  }
}
