import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import { money } from '@/lib/format';
import { useCheckoutQuote, usePlaceOrder } from '@/lib/hooks';
import type { Address, Vendor } from '@/lib/types';

export function CartReviewModal({
  vendor,
  address,
  onClose,
  onPlaced,
  onEditAddress,
}: {
  vendor: Vendor;
  address: Address | null;
  onClose: () => void;
  onPlaced: (orderNumber: string) => void;
  onEditAddress: () => void;
}) {
  const c = useTheme();
  const cart = useCartStore();
  const placeOrder = usePlaceOrder();
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const payment: 'cod' | 'upi' = vendor.cod_enabled ? 'cod' : 'upi';

  const lines = useMemo(
    () => (cart.vendorId === vendor.id ? cart.lines : []),
    [cart.vendorId, cart.lines, vendor.id],
  );
  const subtotal = cart.vendorId === vendor.id ? cart.subtotal() : 0;
  const belowMin = subtotal < vendor.min_order_value;

  const orderItems = useMemo(
    () =>
      lines.map((l) => ({
        item_id: l.itemId,
        quantity: l.quantity,
        variant_id: l.variantId ?? undefined,
        addon_ids: l.addonIds.length ? l.addonIds : undefined,
      })),
    [lines],
  );

  const quote = useCheckoutQuote(
    appliedCode ? { vendor_id: vendor.id, voucher_code: appliedCode, items: orderItems } : null,
    !!appliedCode && lines.length > 0,
  );
  const validVoucher = quote.data?.voucher ?? null;
  const discount = validVoucher ? quote.data!.discount : 0;
  const localTotal = subtotal + (subtotal > 0 ? vendor.delivery_fee : 0);
  const total = quote.data ? quote.data.total : Math.max(0, localTotal);

  const applyVoucher = () => {
    const code = voucherInput.trim();
    if (code) setAppliedCode(code);
  };
  const clearVoucher = () => {
    setAppliedCode(null);
    setVoucherInput('');
  };

  const checkout = async () => {
    try {
      const order = await placeOrder.mutateAsync({
        vendor_id: vendor.id,
        payment_method: payment,
        address_id: address?.id,
        voucher_code: validVoucher ? appliedCode! : undefined,
        items: orderItems,
      });
      cart.clear();
      onPlaced(order.data.order_number);
    } catch (e) {
      Alert.alert('Could not place order', e instanceof ApiError ? e.message : 'Please try again.');
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.four, maxHeight: '88%', gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Your order · {vendor.name}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={c.textSecondary} />
            </Pressable>
          </View>

          {lines.length === 0 ? (
            <Text style={{ color: c.textSecondary, textAlign: 'center', paddingVertical: Spacing.four }}>Your cart is empty.</Text>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 280 }} contentContainerStyle={{ gap: Spacing.three }}>
                {lines.map((l) => (
                  <View key={l.key} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                      <Pressable onPress={() => cart.setQuantity(l.key, l.quantity - 1)} hitSlop={8}>
                        <Ionicons name="remove-circle" size={26} color={c.brand} />
                      </Pressable>
                      <Text style={{ color: c.text, fontWeight: '700', minWidth: 16, textAlign: 'center' }}>{l.quantity}</Text>
                      <Pressable onPress={() => cart.setQuantity(l.key, l.quantity + 1)} hitSlop={8}>
                        <Ionicons name="add-circle" size={26} color={c.brand} />
                      </Pressable>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text }} numberOfLines={1}>{l.name}</Text>
                      {!!l.label && <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>{l.label}</Text>}
                    </View>
                    <Text style={{ color: c.textSecondary }}>{money(l.unitPrice * l.quantity)}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Voucher */}
              {validVoucher ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.success + '22', borderRadius: 12, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }}>
                  <Text style={{ color: c.success, fontWeight: '600' }}>{validVoucher.code} · −{money(discount)}</Text>
                  <Pressable onPress={clearVoucher} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={c.textSecondary} />
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <TextInput
                    value={voucherInput}
                    onChangeText={(t) => setVoucherInput(t.toUpperCase())}
                    placeholder="Promo code"
                    placeholderTextColor={c.textSecondary}
                    autoCapitalize="characters"
                    style={{ flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 12, paddingHorizontal: Spacing.three, color: c.text, height: 44 }}
                  />
                  <Button title="Apply" variant="secondary" onPress={applyVoucher} loading={quote.isFetching} disabled={!voucherInput.trim()} />
                </View>
              )}
              {appliedCode && quote.data?.voucher_error ? (
                <Text style={{ color: c.danger, fontSize: 12 }}>{quote.data.voucher_error}</Text>
              ) : null}

              {/* Totals */}
              <View style={{ gap: 4, borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.two }}>
                <Row label="Subtotal" value={money(subtotal)} color={c.textSecondary} />
                {discount > 0 && <Row label="Discount" value={`−${money(discount)}`} color={c.textSecondary} />}
                <Row label="Delivery" value={vendor.delivery_fee > 0 ? money(vendor.delivery_fee) : 'Free'} color={c.textSecondary} />
                <Row label="Total" value={money(total)} color={c.text} bold />
              </View>

              <Pressable onPress={onEditAddress} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="location-outline" size={14} color={c.textSecondary} />
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                  {address ? `Deliver to ${address.label} · ${address.city}` : 'Add a delivery address'}
                </Text>
              </Pressable>

              {belowMin && (
                <Text style={{ color: c.warning, fontSize: 12 }}>
                  Add {money(vendor.min_order_value - subtotal)} more to reach the minimum order.
                </Text>
              )}

              <Button
                title={vendor.is_open ? `Place order · ${money(total)}` : 'Restaurant closed'}
                onPress={checkout}
                loading={placeOrder.isPending}
                disabled={!vendor.is_open || belowMin}
                fullWidth
              />
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color, fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ color, fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}
