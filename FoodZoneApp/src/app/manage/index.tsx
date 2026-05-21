import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { money, timeAgo } from '@/lib/format';
import { useToggleStoreOpen, useUpdateOrderStatus, useVendorOrders, useVendorStats } from '@/lib/hooks';
import type { Order } from '@/lib/types';

type Action = { label: string; status: string; variant: 'primary' | 'secondary' | 'danger' };

const NEXT_ACTIONS: Record<string, Action[]> = {
  pending: [
    { label: 'Accept', status: 'accepted', variant: 'primary' },
    { label: 'Reject', status: 'rejected', variant: 'danger' },
  ],
  accepted: [{ label: 'Preparing', status: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Ready', status: 'ready', variant: 'primary' }],
  ready: [{ label: 'Out for delivery', status: 'out_for_delivery', variant: 'primary' }],
  out_for_delivery: [{ label: 'Delivered', status: 'delivered', variant: 'primary' }],
};

export default function ManageDashboardScreen() {
  const c = useTheme();
  const router = useRouter();
  const stats = useVendorStats();
  const toggle = useToggleStoreOpen();
  const orders = useVendorOrders();
  const updateStatus = useUpdateOrderStatus();

  const orderList = orders.data?.pages.flatMap((p) => p.data) ?? [];

  const advance = (orderId: number, status: string) => {
    updateStatus.mutate({ orderId, status }, { onError: () => Alert.alert('Error', 'Could not update order.') });
  };

  const statusColor = (s: string) =>
    s === 'delivered' ? c.success : s === 'cancelled' || s === 'rejected' ? c.danger : s === 'pending' ? c.warning : c.brand;

  const Header = (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.three }}>
      {stats.isLoading ? (
        <Loading />
      ) : stats.isError || !stats.data ? (
        <ErrorView message="Couldn't load your store. Are you a vendor?" onRetry={stats.refetch} />
      ) : (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
            <View>
              <Text style={{ color: c.text, fontWeight: '600' }}>Store status</Text>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>{stats.data.is_open ? 'Accepting orders' : 'Closed'}</Text>
            </View>
            <Button
              title={stats.data.is_open ? 'Close' : 'Open'}
              variant={stats.data.is_open ? 'danger' : 'primary'}
              loading={toggle.isPending}
              onPress={() => toggle.mutate(!stats.data!.is_open)}
            />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
            <StatCard c={c} label="Pending" value={String(stats.data.pending_orders)} />
            <StatCard c={c} label="Today" value={String(stats.data.orders_today)} />
            <StatCard c={c} label="Revenue" value={money(stats.data.revenue_today)} />
            <StatCard c={c} label="Rating" value={stats.data.rating_avg > 0 ? stats.data.rating_avg.toFixed(1) : '—'} />
          </View>

          <Pressable
            onPress={() => router.push('/manage/reviews')}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}
          >
            <Text style={{ color: c.text, fontWeight: '600' }}>Reviews</Text>
            <Ionicons name="chevron-forward" size={18} color={c.textSecondary} />
          </Pressable>

          <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>Incoming orders</Text>
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
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>My Store</Text>
      </View>

      <FlatList
        data={orderList}
        keyExtractor={(o) => String(o.id)}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
        ListHeaderComponent={Header}
        refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={orders.refetch} tintColor={c.brand} />}
        onEndReached={() => orders.hasNextPage && orders.fetchNextPage()}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={!stats.isLoading ? <EmptyView title="No orders yet" hint="New orders will appear here." /> : null}
        renderItem={({ item }: { item: Order }) => (
          <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ color: c.text, fontWeight: '600' }}>{item.order_number}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{timeAgo(item.created_at)} · {money(item.total)}</Text>
              </View>
              <Badge label={item.status.replace(/_/g, ' ')} color={statusColor(item.status)} />
            </View>
            {(NEXT_ACTIONS[item.status] ?? []).length > 0 && (
              <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two }}>
                {NEXT_ACTIONS[item.status].map((a) => (
                  <Button key={a.status} title={a.label} variant={a.variant} loading={updateStatus.isPending} onPress={() => advance(item.id, a.status)} />
                ))}
              </View>
            )}
          </View>
        )}
      />
    </SafeAreaView>
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
