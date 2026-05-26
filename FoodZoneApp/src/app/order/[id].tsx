import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/lib/format';
import { useOrderDetail } from '@/lib/hooks';
import type { OrderItem } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Order placed',
  accepted: 'Accepted by restaurant',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
};

function customizationLabel(c: Record<string, unknown> | null | undefined): string {
  if (!c) return '';
  const parts: string[] = [];
  const variant = c.variant as { name?: string } | undefined;
  if (variant?.name) parts.push(variant.name);
  const addons = c.addons as { name?: string }[] | undefined;
  if (Array.isArray(addons)) parts.push(...(addons.map((a) => a.name).filter(Boolean) as string[]));
  return parts.join(' · ');
}

export default function OrderDetailScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useOrderDetail(Number(id));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Ionicons name="arrow-back" size={24} color={c.text} onPress={() => router.back()} />
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Order details</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !order ? (
        <ErrorView message="Couldn't load this order." onRetry={refetch} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
          <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '700' }}>{order.vendor?.name ?? 'Restaurant'}</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>{order.order_number}</Text>
              </View>
              <Text style={{ color: c.textSecondary, textTransform: 'capitalize' }}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
            {order.delivery_partner && (
              <Text style={{ color: c.textSecondary, fontSize: 13, marginTop: 6 }}>Delivery partner: {order.delivery_partner.name}</Text>
            )}
          </View>

          {/* Items */}
          <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.two }}>
            <Text style={{ color: c.text, fontWeight: '700' }}>Items</Text>
            {order.items?.map((it: OrderItem) => (
              <View key={it.id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text }}>{it.quantity}× {it.item_name}</Text>
                  {!!customizationLabel(it.customizations) && (
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{customizationLabel(it.customizations)}</Text>
                  )}
                </View>
                <Text style={{ color: c.textSecondary }}>{money(it.line_total)}</Text>
              </View>
            ))}
            <View style={{ borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.two, gap: 4 }}>
              <Row label="Subtotal" value={money(order.subtotal)} c={c} />
              {order.discount > 0 && <Row label="Discount" value={`−${money(order.discount)}`} c={c} />}
              <Row label="Delivery" value={order.delivery_charge > 0 ? money(order.delivery_charge) : 'Free'} c={c} />
              <Row label="Total" value={money(order.total)} c={c} bold />
              <Row label="Payment" value={`${order.payment_method.toUpperCase()} · ${order.payment_status}`} c={c} />
            </View>
          </View>

          {/* Timeline */}
          {order.status_history && order.status_history.length > 0 && (
            <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.three }}>
              <Text style={{ color: c.text, fontWeight: '700' }}>Order timeline</Text>
              {order.status_history.map((h, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: Spacing.three }}>
                  <View style={{ width: 12, alignItems: 'center' }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: i === 0 ? c.brand : c.border, marginTop: 3 }} />
                    {i < order.status_history!.length - 1 && <View style={{ width: 2, flex: 1, backgroundColor: c.border, marginTop: 2 }} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: Spacing.two }}>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{STATUS_LABEL[h.status] ?? h.status}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>{new Date(h.at).toLocaleString()}</Text>
                    {!!h.note && <Text style={{ color: c.textSecondary, fontSize: 12 }}>{h.note}</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Row({ label, value, c, bold }: { label: string; value: string; c: ReturnType<typeof useTheme>; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: bold ? c.text : c.textSecondary, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color: bold ? c.text : c.textSecondary, fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}
