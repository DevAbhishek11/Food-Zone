import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { useDeactivateAccount } from '@/lib/hooks';

const APP_VERSION = '3.0.0';

type IoniconName = keyof typeof Ionicons.glyphMap;

export default function SettingsScreen() {
  const c = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const deactivate = useDeactivateAccount();
  const [confirming, setConfirming] = useState(false);

  const onDeactivate = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    deactivate.mutate(undefined, {
      onSuccess: async () => {
        await logout();
        router.replace('/login');
      },
      onError: () => {
        Alert.alert('Could not deactivate', 'Please try again.');
        setConfirming(false);
      },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
        <Section title="Account">
          <Row icon="mail-outline" label="Profile details" hint={user?.email} onPress={() => router.back()} />
          <Row icon="receipt-outline" label="Delivery addresses" onPress={() => router.push('/addresses')} />
          <Row icon="cart-outline" label="Order history" onPress={() => router.push('/(tabs)/orders' as never)} />
        </Section>

        <Section title="Notifications">
          <Row icon="notifications-outline" label="Inbox" onPress={() => router.push('/(tabs)/inbox' as never)} />
        </Section>

        <Section title="Loyalty">
          <Row icon="sparkles-outline" label="Points & badges" onPress={() => router.back()} />
          <Row icon="trophy-outline" label="Leaderboard" onPress={() => router.push('/leaderboard' as never)} />
        </Section>

        <Section title="About">
          <RowStatic icon="information-circle-outline" label="App version" hint={APP_VERSION} />
          <Row icon="document-text-outline" label="Terms of Service" onPress={() => Linking.openURL('https://foodzone.app/terms')} external />
          <Row icon="lock-closed-outline" label="Privacy Policy" onPress={() => Linking.openURL('https://foodzone.app/privacy')} external />
          <Row icon="mail-outline" label="Contact support" onPress={() => Linking.openURL('mailto:support@foodzone.app')} external />
        </Section>

        <View style={{ borderWidth: 1, borderColor: c.danger + '66', backgroundColor: c.danger + '11', padding: Spacing.three, borderRadius: 14, gap: Spacing.two }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="warning-outline" size={16} color={c.danger} />
            <Text style={{ color: c.danger, fontSize: 13, fontWeight: '600' }}>Danger zone</Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 13 }}>
            Deactivating hides your profile, posts and reviews. Sign back in later to restore.
          </Text>
          <Button
            title={confirming ? 'Tap again to confirm' : 'Deactivate my account'}
            variant="danger"
            onPress={onDeactivate}
            loading={deactivate.isPending}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
      <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function Row({
  icon,
  label,
  hint,
  onPress,
  external,
}: {
  icon: IoniconName;
  label: string;
  hint?: string;
  onPress: () => void;
  external?: boolean;
}) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
        padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border,
      }}
    >
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: '500' }}>{label}</Text>
        {hint && <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>{hint}</Text>}
      </View>
      <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={16} color={c.textSecondary} />
    </Pressable>
  );
}

function RowStatic({ icon, label, hint }: { icon: IoniconName; label: string; hint: string }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <Text style={{ flex: 1, color: c.text, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{hint}</Text>
    </View>
  );
}
