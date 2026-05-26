import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { RateOrderModal } from '@/components/rate-order-modal';
import { Stars } from '@/components/stars';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { money, timeAgo } from '@/lib/format';
import { useOrders, usePayOrder, useReorder } from '@/lib/hooks';
import type { Order } from '@/lib/types';

const TERMINAL = ['delivered', 'cancelled', 'rejected'];

export default function OrdersScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useOrders();
  const reorder = useReorder();
  const pay = usePayOrder();
  const orders = data?.pages.flatMap((p) => p.data) ?? [];
  const [rating, setRating] = useState<{ id: number; vendor: string } | null>(null);
  const [payingId, setPayingId] = useState<number | null>(null);

  const doPay = (orderId: number) => {
    setPayingId(orderId);
    pay.mutate(orderId, {
      onSuccess: () => Alert.alert('Payment successful', 'Your order has been paid.'),
      onError: (e) => Alert.alert('Payment failed', e instanceof ApiError ? e.message : 'Try again.'),
      onSettled: () => setPayingId(null),
    });
  };

  const statusColor = (status: string): string => {
    if (status === 'delivered') return c.success;
    if (status === 'cancelled' || status === 'rejected') return c.danger;
    if (status === 'pending') return c.warning;
    return c.brand;
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>My Orders</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load your orders." onRetry={refetch} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => String(o.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="No orders yet" hint="Browse restaurants and place your first order." />}
          renderItem={({ item }: { item: Order }) => (
            <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/order/${item.id}`)}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{item.vendor?.name ?? 'Restaurant'}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                    {item.order_number} · {timeAgo(item.created_at)}
                  </Text>
                </Pressable>
                <Badge label={item.status.replace(/_/g, ' ')} color={statusColor(item.status)} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, marginTop: Spacing.two, paddingTop: Spacing.two }}>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  {item.items?.length ?? 0} item(s) · {item.payment_method.toUpperCase()}
                </Text>
                <Text style={{ color: c.text, fontWeight: '700' }}>{money(item.total)}</Text>
              </View>

              {item.payment_method !== 'cod' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, marginTop: Spacing.two, paddingTop: Spacing.two }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color:
                        item.payment_status === 'paid' ? c.success : item.payment_status === 'refunded' ? c.textSecondary : c.warning,
                    }}
                  >
                    {item.payment_status === 'paid' ? '✓ Paid online' : item.payment_status === 'refunded' ? 'Refunded' : 'Awaiting payment'}
                  </Text>
                  {item.payable && (
                    <Button title={`Pay ${money(item.total)}`} loading={payingId === item.id} onPress={() => doPay(item.id)} />
                  )}
                </View>
              )}

              {TERMINAL.includes(item.status) && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, marginTop: Spacing.two, paddingTop: Spacing.two }}>
                  {item.status === 'delivered' && item.rating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                      <Stars value={item.rating.rating} />
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>Your rating</Text>
                    </View>
                  ) : item.status === 'delivered' ? (
                    <Pressable onPress={() => setRating({ id: item.id, vendor: item.vendor?.name ?? 'this order' })}>
                      <Text style={{ color: c.brand, fontWeight: '600' }}>Rate order</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                  <Button
                    title="Reorder"
                    loading={reorder.isPending}
                    onPress={() =>
                      reorder.mutate(item.id, {
                        onSuccess: () => Alert.alert('Reorder placed', 'Your reorder has been placed.'),
                        onError: (e) => Alert.alert('Could not reorder', e instanceof ApiError ? e.message : 'Try again.'),
                      })
                    }
                  />
                </View>
              )}
            </View>
          )}
        />
      )}

      {rating && (
        <RateOrderModal orderId={rating.id} vendorName={rating.vendor} onClose={() => setRating(null)} />
      )}
    </SafeAreaView>
  );
}
