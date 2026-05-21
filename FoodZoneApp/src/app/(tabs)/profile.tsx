import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';

export default function ProfileScreen() {
  const c = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) return null;

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
            <Avatar uri={user.profile?.avatar} name={user.name} size={72} />
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{user.name}</Text>
                {user.email_verified && <Ionicons name="checkmark-circle" size={18} color={c.brand} />}
              </View>
              <Text style={{ color: c.textSecondary }}>@{user.username}</Text>
            </View>
          </View>

          {!!user.profile?.bio && <Text style={{ color: c.text }}>{user.profile.bio}</Text>}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="mail-outline" size={16} color={c.textSecondary} />
            <Text style={{ color: c.textSecondary }}>{user.email}</Text>
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
