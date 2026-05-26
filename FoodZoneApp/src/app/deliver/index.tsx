import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { money, timeAgo } from '@/lib/format';
import {
  useAcceptDelivery,
  useAvailableDeliveries,
  useBecomeDeliveryPartner,
  useDeliverOrder,
  useDeliveryStats,
  useMyDeliveries,
  usePickUpDelivery,
  useReleaseDelivery,
} from '@/lib/hooks';
import type { Order } from '@/lib/types';

type Tab = 'available' | 'active' | 'completed';

export default function DeliveryScreen() {
  const c = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isPartner = user?.role === 'delivery' || user?.role === 'admin' || user?.role === 'super_admin';
  const become = useBecomeDeliveryPartner();

  const [tab, setTab] = useState<Tab>('available');
  const { data: stats } = useDeliveryStats(isPartner);
  const available = useAvailableDeliveries(isPartner && tab === 'available');
  const active = useMyDeliveries('active', isPartner && tab === 'active');
  const completed = useMyDeliveries('completed', isPartner && tab === 'completed');

  const accept = useAcceptDelivery();
  const release = useReleaseDelivery();
  const pickUp = usePickUpDelivery();
  const deliver = useDeliverOrder();
  const busy = accept.isPending || release.isPending || pickUp.isPending || deliver.isPending;

  const join = async () => {
    try {
      await become.mutateAsync();
      if (user) setUser({ ...user, role: 'delivery' });
    } catch (e) {
      Alert.alert('Could not register', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

  const run = (p: Promise<unknown>, ok: string) =>
    p.then(() => Alert.alert('Done', ok)).catch((e) => Alert.alert('Action failed', e instanceof ApiError ? e.message : 'Try again.'));

  const Header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border }}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="arrow-back" size={24} color={c.text} />
      </Pressable>
      <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Deliveries</Text>
    </View>
  );

  if (!isPartner) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
        {Header}
        <View style={{ padding: Spacing.four, alignItems: 'center', gap: Spacing.three, marginTop: Spacing.four }}>
          <Ionicons name="bicycle" size={48} color={c.brand} />
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Become a delivery partner</Text>
          <Text style={{ color: c.textSecondary, textAlign: 'center' }}>
            Accept nearby orders, pick them up, and deliver to earn. You can switch back anytime.
          </Text>
          <Button title="Start delivering" fullWidth loading={become.isPending} onPress={join} />
        </View>
      </SafeAreaView>
    );
  }

  const lists = { available, active, completed } as const;
  const current = lists[tab];
  const orders: Order[] = current.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      {Header}

      <View style={{ flexDirection: 'row', gap: Spacing.two, padding: Spacing.three }}>
        <Stat label="Active" value={stats?.active ?? 0} c={c} />
        <Stat label="Today" value={stats?.delivered_today ?? 0} c={c} />
        <Stat label="Total" value={stats?.total_delivered ?? 0} c={c} />
      </View>

      <View style={{ flexDirection: 'row', marginHorizontal: Spacing.three, marginBottom: Spacing.two, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: 4 }}>
        {(['available', 'active', 'completed'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={{ flex: 1, paddingVertical: 8, borderRadius: 9, backgroundColor: tab === t ? c.brand : 'transparent', alignItems: 'center' }}
          >
            <Text style={{ color: tab === t ? '#fff' : c.textSecondary, fontWeight: '600', textTransform: 'capitalize', fontSize: 13 }}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {current.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          onEndReached={() => current.hasNextPage && current.fetchNextPage()}
          onEndReachedThreshold={0.5}
          refreshing={current.isRefetching}
          onRefresh={current.refetch}
          ListEmptyComponent={
            <EmptyView
              title={tab === 'available' ? 'No orders to pick up' : tab === 'active' ? 'No active deliveries' : 'No completed deliveries'}
              hint={tab === 'available' ? 'New orders appear here when restaurants are ready.' : undefined}
            />
          }
          renderItem={({ item }) => (
            <DeliveryCard
              order={item}
              tab={tab}
              busy={busy}
              onAccept={() => run(accept.mutateAsync(item.id), 'Delivery accepted.')}
              onRelease={() => run(release.mutateAsync(item.id), 'Delivery released.')}
              onPickUp={() => run(pickUp.mutateAsync(item.id), 'Marked picked up.')}
              onDeliver={() => run(deliver.mutateAsync(item.id), 'Marked delivered.')}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Stat({ label, value, c }: { label: string; value: number; c: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: Spacing.two, alignItems: 'center' }}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

function DeliveryCard({
  order,
  tab,
  busy,
  onAccept,
  onRelease,
  onPickUp,
  onDeliver,
}: {
  order: Order;
  tab: Tab;
  busy: boolean;
  onAccept: () => void;
  onRelease: () => void;
  onPickUp: () => void;
  onDeliver: () => void;
}) {
  const c = useTheme();
  const addr = order.delivery_address;

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{ color: c.text, fontWeight: '700', flex: 1 }} numberOfLines={1}>{order.vendor?.name ?? 'Restaurant'}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, textTransform: 'capitalize' }}>{order.status.replace(/_/g, ' ')}</Text>
      </View>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>
        {order.order_number} · {timeAgo(order.created_at)} · {order.payment_method.toUpperCase()}
      </Text>
      <Text style={{ color: c.textSecondary, fontSize: 13 }}>
        {order.items?.length ?? 0} item(s) · {money(order.total)}
      </Text>
      {addr ? (
        <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>
          Deliver to: {addr.address}{addr.city ? `, ${addr.city}` : ''}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.two, marginTop: Spacing.two }}>
        {tab === 'available' && <Button title="Accept" onPress={onAccept} disabled={busy} />}
        {tab === 'active' && order.status === 'ready' && (
          <>
            <Button title="Release" variant="secondary" onPress={onRelease} disabled={busy} />
            <Button title="Picked up" onPress={onPickUp} disabled={busy} />
          </>
        )}
        {tab === 'active' && order.status === 'out_for_delivery' && <Button title="Delivered" onPress={onDeliver} disabled={busy} />}
        {tab === 'active' && (order.status === 'preparing' || order.status === 'accepted') && (
          <Button title="Release" variant="secondary" onPress={onRelease} disabled={busy} />
        )}
      </View>
    </View>
  );
}
