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

export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const c = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', password_confirmation: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setErrors({});
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post<AuthPayload>('/auth/register', form, { auth: false });
      await setAuth(data.user, data.token);
      router.replace('/');
    } catch (e) {
      if (e instanceof ApiError && e.errors) {
        const flat: Record<string, string> = {};
        for (const [k, v] of Object.entries(e.errors)) flat[k] = v[0];
        setErrors(flat);
      } else {
        setErrors({ form: e instanceof ApiError ? e.message : 'Registration failed.' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.two }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="restaurant" size={28} color="#fff" />
            </View>
            <Text style={{ color: c.text, fontSize: 24, fontWeight: '700' }}>Join FoodZone</Text>
            <Text style={{ color: c.textSecondary }}>Create your free account</Text>
          </View>

          {errors.form && <Text style={{ color: c.danger, textAlign: 'center' }}>{errors.form}</Text>}

          <Field label="Full name" value={form.name} onChangeText={set('name')} placeholder="Jane Doe" error={errors.name} />
          <Field label="Username" value={form.username} onChangeText={set('username')} placeholder="janedoe" autoCapitalize="none" error={errors.username} />
          <Field label="Email" value={form.email} onChangeText={set('email')} placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" error={errors.email} />
          <Field label="Password" value={form.password} onChangeText={set('password')} placeholder="••••••••" secureTextEntry error={errors.password} />
          <Field label="Confirm password" value={form.password_confirmation} onChangeText={set('password_confirmation')} placeholder="••••••••" secureTextEntry error={errors.password_confirmation} />

          <Button title="Create account" onPress={submit} loading={submitting} fullWidth />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: Spacing.two }}>
            <Text style={{ color: c.textSecondary }}>Already have an account?</Text>
            <Link href="/login" style={{ color: c.brand, fontWeight: '600' }}>
              Sign in
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
