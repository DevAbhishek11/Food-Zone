import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Field } from '@/components/ui';
import { Colors, Spacing } from '@/constants/theme';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import type { AuthPayload } from '@/lib/types';

export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setErrors({});
    if (!email.trim() || !password) {
      setErrors({ form: 'Enter your email and password.' });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<AuthPayload>('/auth/login', { email, password }, { auth: false });
      await setAuth(data.user, data.token);
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.errors)) flat[k] = v[0];
        setErrors(flat);
      } else {
        setErrors({ form: e instanceof ApiError ? e.message : 'Login failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.three }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="restaurant" size={28} color="#fff" />
            </View>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: '700' }}>Welcome to FoodZone</Text>
            <Text style={{ color: c.textSecondary }}>Sign in to your account</Text>
          </View>

          {errors.form && <Text style={{ color: c.danger, textAlign: 'center' }}>{errors.form}</Text>}

          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            keyboardType="email-address"
            error={errors.email}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button title="Sign in" onPress={submit} loading={submitting} fullWidth />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.two }}>
            <Text style={{ color: c.textSecondary }}>New here?</Text>
            <Link href="/register" style={{ color: c.brand, fontWeight: '600' }}>
              Create an account
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
