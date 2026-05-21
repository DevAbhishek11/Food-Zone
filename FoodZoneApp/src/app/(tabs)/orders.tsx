import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Badge, EmptyView, ErrorView, Loading } from '@/components/ui';
import { RateOrderModal } from '@/components/rate-order-modal';
import { Stars } from '@/components/stars';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { money, timeAgo } from '@/lib/format';
import { useOrders } from '@/lib/hooks';
import type { Order } from '@/lib/types';

export default function OrdersScreen() {
  const c = useTheme();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useOrders();
  const orders = data?.pages.flatMap((p) => p.data) ?? [];
  const [rating, setRating] = useState<{ id: number; vendor: string } | null>(null);

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
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{item.vendor?.name ?? 'Restaurant'}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                    {item.order_number} · {timeAgo(item.created_at)}
                  </Text>
                </View>
                <Badge label={item.status.replace(/_/g, ' ')} color={statusColor(item.status)} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: c.border, marginTop: Spacing.two, paddingTop: Spacing.two }}>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                  {item.items?.length ?? 0} item(s) · {item.payment_method.toUpperCase()}
                </Text>
                <Text style={{ color: c.text, fontWeight: '700' }}>{money(item.total)}</Text>
              </View>

              {item.status === 'delivered' && (
                <View style={{ borderTopWidth: 1, borderTopColor: c.border, marginTop: Spacing.two, paddingTop: Spacing.two }}>
                  {item.rating ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                      <Stars value={item.rating.rating} />
                      <Text style={{ color: c.textSecondary, fontSize: 12 }}>Your rating</Text>
                    </View>
                  ) : (
                    <Pressable onPress={() => setRating({ id: item.id, vendor: item.vendor?.name ?? 'this order' })}>
                      <Text style={{ color: c.brand, fontWeight: '600' }}>Rate order</Text>
                    </Pressable>
                  )}
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
