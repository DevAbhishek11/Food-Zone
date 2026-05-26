import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useUpdateProfile } from '@/lib/hooks';
import { useMediaUpload } from '@/lib/use-media';

export default function ProfileScreen() {
  const c = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useUpdateProfile();
  const { pickAndUpload, uploading } = useMediaUpload();
  const [resending, setResending] = useState(false);

  if (!user) return null;

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification');
      Alert.alert('Verification sent', 'Check your inbox for the verification link.');
    } catch (e) {
      Alert.alert('Could not send', e instanceof ApiError ? e.message : 'Please try again.');
    } finally {
      setResending(false);
    }
  };

  const changeAvatar = async () => {
    const url = await pickAndUpload('avatar');
    if (url) {
      updateProfile.mutate(
        { avatar: url },
        { onError: () => Alert.alert('Error', 'Could not update avatar.') },
      );
    }
  };

  const stats = [
    { label: 'Posts', value: user.profile?.posts_count ?? 0 },
    { label: 'Followers', value: user.profile?.followers_count ?? 0 },
    { label: 'Following', value: user.profile?.following_count ?? 0 },
  ];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Profile</Text>

        <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <Pressable onPress={changeAvatar} disabled={uploading}>
              <Avatar uri={user.profile?.avatar} name={user.name} size={72} />
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: c.brand, borderRadius: 999, padding: 4 }}>
                <Ionicons name={uploading ? 'hourglass' : 'camera'} size={12} color="#fff" />
              </View>
            </Pressable>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{user.name}</Text>
                {user.email_verified && <Ionicons name="checkmark-circle" size={18} color={c.brand} />}
              </View>
              <Text style={{ color: c.textSecondary }}>@{user.username}</Text>
            </View>
          </View>

          {!!user.profile?.bio && <Text style={{ color: c.text }}>{user.profile.bio}</Text>}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Ionicons name="mail-outline" size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary }}>{user.email}</Text>
            {!user.email_verified && (
              <>
                <Text style={{ color: c.warning, fontSize: 12, fontWeight: '600' }}>Unverified</Text>
                <Pressable onPress={resendVerification} disabled={resending}>
                  <Text style={{ color: c.brand, fontSize: 12, fontWeight: '600' }}>
                    {resending ? 'Sending…' : 'Resend'}
                  </Text>
                </Pressable>
              </>
            )}
          </View>

          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.three }}>
            {stats.map((s) => (
              <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{s.value}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <Button title="Delivery addresses" variant="secondary" fullWidth onPress={() => router.push('/addresses')} />

        {(user.role === 'user' || user.role === 'delivery') && (
          <Button
            title={user.role === 'delivery' ? 'Delivery dashboard' : 'Become a delivery partner'}
            variant="secondary"
            fullWidth
            onPress={() => router.push('/deliver')}
          />
        )}

        {user.role === 'vendor' && (
          <Button title="Manage store" variant="secondary" fullWidth onPress={() => router.push('/manage')} />
        )}

        {(user.role === 'admin' || user.role === 'super_admin') && (
          <Button title="Admin console" variant="secondary" fullWidth onPress={() => router.push('/admin')} />
        )}

        <Button
          title="Log out"
          variant="danger"
          fullWidth
          onPress={async () => {
            await logout();
            router.replace('/login');
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
