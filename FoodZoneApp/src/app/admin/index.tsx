import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/lib/format';
import { useAdminDashboard, useAdminVendors, useVendorModeration } from '@/lib/hooks';
import type { Vendor } from '@/lib/types';

export default function AdminScreen() {
  const c = useTheme();
  const router = useRouter();
  const stats = useAdminDashboard();
  const vendors = useAdminVendors('pending');
  const pending = vendors.data?.pages.flatMap((p) => p.data) ?? [];

  const Header = (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.three }}>
      {stats.isLoading ? (
        <Loading />
      ) : stats.isError || !stats.data ? (
        <ErrorView message="Couldn't load admin metrics. Admins only." onRetry={stats.refetch} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            <StatCard c={c} label="Users" value={String(stats.data.users_total)} />
            <StatCard c={c} label="Vendors" value={`${stats.data.vendors_approved}/${stats.data.vendors_total}`} />
            <StatCard c={c} label="Orders today" value={String(stats.data.orders_today)} />
            <StatCard c={c} label="Revenue today" value={money(stats.data.revenue_today)} />
          </View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>
            Pending vendors ({stats.data.vendors_pending})
          </Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Admin</Text>
      </View>

      <FlatList
        data={pending}
        keyExtractor={(v) => String(v.id)}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        ListHeaderComponent={Header}
        onEndReached={() => vendors.hasNextPage && vendors.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!stats.isLoading && !stats.isError ? <EmptyView title="No pending vendors" hint="New applications appear here." /> : null}
        renderItem={({ item }) => <PendingVendor vendor={item} />}
      />
    </SafeAreaView>
  );
}

function PendingVendor({ vendor }: { vendor: Vendor }) {
  const c = useTheme();
  const { approve, reject } = useVendorModeration();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const doReject = () => {
    if (!reason.trim()) {
      Alert.alert('Reason required', 'Please provide a rejection reason.');
      return;
    }
    reject.mutate({ id: vendor.id, reason: reason.trim() }, { onError: () => Alert.alert('Error', 'Could not reject.') });
  };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '600' }}>{vendor.name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>{vendor.city ?? '—'}</Text>
        </View>
        <Badge label={vendor.status} color={c.warning} />
      </View>
      {!!vendor.description && <Text style={{ color: c.textSecondary, fontSize: 13 }} numberOfLines={2}>{vendor.description}</Text>}

      {rejecting ? (
        <View style={{ gap: Spacing.two }}>
          <TextInput
            value={reason}
            onChangeText={setReason}
            placeholder="Reason for rejection…"
            placeholderTextColor={c.textSecondary}
            style={{ height: 40, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: Spacing.three, color: c.text }}
          />
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            <Button title="Confirm reject" variant="danger" loading={reject.isPending} onPress={doReject} />
            <Button title="Cancel" variant="secondary" onPress={() => setRejecting(false)} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: 4 }}>
          <Button title="Approve" loading={approve.isPending} onPress={() => approve.mutate(vendor.id, { onError: () => Alert.alert('Error', 'Could not approve.') })} />
          <Button title="Reject" variant="secondary" onPress={() => setRejecting(true)} />
        </View>
      )}
    </View>
  );
}

function StatCard({ c, label, value }: { c: ReturnType<typeof useTheme>; label: string; value: string }) {
  return (
    <View style={{ flexGrow: 1, minWidth: '47%', backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}
