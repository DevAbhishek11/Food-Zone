import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { useLoyalty, useUpdateProfile } from '@/lib/hooks';
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

        <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
          <View
            style={{
              height: 90,
              backgroundColor: user.profile?.cover ? undefined : c.brand + '33',
            }}
          >
            {user.profile?.cover ? (
              <Image source={{ uri: user.profile.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : null}
          </View>
          <View style={{ padding: Spacing.four, gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.three, marginTop: -Spacing.four }}>
            <Pressable onPress={changeAvatar} disabled={uploading} style={{ borderWidth: 3, borderColor: c.card, borderRadius: 999 }}>
              <Avatar uri={user.profile?.avatar} name={user.name} size={72} />
              <View style={{ position: 'absolute', bottom: -2, right: -2, backgroundColor: c.brand, borderRadius: 999, padding: 4 }}>
                <Ionicons name={uploading ? 'hourglass' : 'camera'} size={12} color="#fff" />
              </View>
            </Pressable>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{user.name}</Text>
                {user.is_verified && <Ionicons name="shield-checkmark" size={18} color={c.info} />}
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
        </View>

        <LoyaltyCard />

        <DetailsEditor />

        <Button title="Settings" variant="secondary" fullWidth onPress={() => router.push('/settings')} />
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

const TIER_TINT: Record<string, { bg: string; fg: string; label: string }> = {
  bronze: { bg: '#b45309', fg: '#fff', label: 'Bronze' },
  silver: { bg: '#71717a', fg: '#fff', label: 'Silver' },
  gold: { bg: '#eab308', fg: '#fff', label: 'Gold' },
  platinum: { bg: '#06b6d4', fg: '#fff', label: 'Platinum' },
};

function LoyaltyCard() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading } = useLoyalty();
  if (isLoading || !data) {
    return <View style={{ height: 90, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border }} />;
  }
  const tier = TIER_TINT[data.tier] ?? TIER_TINT.bronze;
  const unlocked = data.badges.filter((b) => b.unlocked);
  const next = data.next_tier;
  const progressPct = next
    ? Math.min(100, Math.round(100 * data.lifetime_points / (data.lifetime_points + next.points_to_go)))
    : 100;

  return (
    <Pressable onPress={() => router.push('/leaderboard' as never)} style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: tier.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={20} color={tier.fg} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: tier.bg, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{tier.label}</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{data.points.toLocaleString()} pts</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
      </View>
      {next && (
        <View style={{ gap: 4 }}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {next.points_to_go.toLocaleString()} pts to {TIER_TINT[next.name]?.label ?? next.name}
          </Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: c.backgroundElement, overflow: 'hidden' }}>
            <View style={{ width: `${progressPct}%`, height: '100%', backgroundColor: tier.bg }} />
          </View>
        </View>
      )}
      {unlocked.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: Spacing.two, borderTopWidth: 1, borderTopColor: c.border }}>
          {unlocked.map((b) => (
            <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.backgroundElement }}>
              <Ionicons name="ribbon" size={12} color={c.brand} />
              <Text style={{ color: c.text, fontSize: 11, fontWeight: '600' }}>{b.name}</Text>
            </View>
          ))}
        </View>
      )}
    </Pressable>
  );
}

function DetailsEditor() {
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const update = useUpdateProfile();
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [location, setLocation] = useState(user?.profile?.location ?? '');
  const [website, setWebsite] = useState(user?.profile?.website ?? '');
  const [isPrivate, setIsPrivate] = useState(!!user?.profile?.is_private);

  const save = () => {
    update.mutate(
      {
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim() || undefined,
        is_private: isPrivate,
      },
      {
        onSuccess: () => Alert.alert('Saved', 'Profile updated.'),
        onError: (e) => Alert.alert('Error', e instanceof ApiError ? e.message : 'Try again.'),
      },
    );
  };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.four, gap: Spacing.two }}>
      <Text style={{ color: c.text, fontWeight: '700', marginBottom: Spacing.one }}>About you</Text>
      <TextInput
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people what you love eating…"
        placeholderTextColor={c.textSecondary}
        multiline
        maxLength={500}
        style={{ minHeight: 70, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: Spacing.three, color: c.text, textAlignVertical: 'top' }}
      />
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="City"
        placeholderTextColor={c.textSecondary}
        maxLength={100}
        style={{ height: 44, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: Spacing.three, color: c.text }}
      />
      <TextInput
        value={website}
        onChangeText={setWebsite}
        placeholder="https://your.site"
        placeholderTextColor={c.textSecondary}
        autoCapitalize="none"
        keyboardType="url"
        maxLength={255}
        style={{ height: 44, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: Spacing.three, color: c.text }}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: c.textSecondary }}>Private account</Text>
        <Switch value={isPrivate} onValueChange={setIsPrivate} trackColor={{ true: c.brand }} />
      </View>
      <Button title="Save changes" onPress={save} loading={update.isPending} fullWidth />
    </View>
  );
}
