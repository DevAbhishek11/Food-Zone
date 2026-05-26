import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorView, Loading } from '@/components/ui';
import { CartReviewModal } from '@/components/cart-review-modal';
import { CustomizeSheet } from '@/components/customize-sheet';
import { FavoriteHeart } from '@/components/favorite-heart';
import { VendorReviews } from '@/components/vendor-reviews';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCartStore } from '@/lib/cart-store';
import { money } from '@/lib/format';
import { useAddresses, useVendorMenu } from '@/lib/hooks';
import type { MenuItem, Vendor } from '@/lib/types';

export default function VendorMenuScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useVendorMenu(id);
  const { data: addresses } = useAddresses();
  const cart = useCartStore();
  const [reviewing, setReviewing] = useState(false);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <Loading />
      </SafeAreaView>
    );
  }
  if (isError || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <ErrorView message="Couldn't load this restaurant." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const { vendor, categories, uncategorized } = data.data;
  const groups = [
    ...categories.map((cat) => ({ name: cat.name, items: cat.items ?? [] })),
    ...(uncategorized.length ? [{ name: 'More', items: uncategorized }] : []),
  ].filter((g) => g.items.length > 0);

  const isThisVendor = cart.vendorId === vendor.id;
  const subtotal = isThisVendor ? cart.subtotal() : 0;
  const count = isThisVendor ? cart.count() : 0;
  const estTotal = subtotal + (subtotal > 0 ? vendor.delivery_fee : 0);

  const deliveryAddress = addresses?.find((a) => a.is_default) ?? addresses?.[0] ?? null;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text numberOfLines={1} style={{ color: c.text, fontSize: 18, fontWeight: '700', flex: 1 }}>
          {vendor.name}
        </Text>
        <FavoriteHeart vendorId={vendor.id} initial={vendor.is_favorited} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: count > 0 ? 96 : Spacing.four }}>
        <View style={{ height: 160, backgroundColor: c.backgroundElement }}>
          {vendor.banner && <Image source={{ uri: vendor.banner }} style={{ width: '100%', height: '100%' }} contentFit="cover" />}
        </View>

        <View style={{ padding: Spacing.three, gap: 6 }}>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>{vendor.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="star" size={14} color={c.warning} />
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>
                {vendor.rating_avg > 0 ? `${vendor.rating_avg.toFixed(1)} (${vendor.rating_count})` : 'New'}
              </Text>
            </View>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>{vendor.prep_time_minutes} min</Text>
            {vendor.min_order_value > 0 && (
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>Min {money(vendor.min_order_value)}</Text>
            )}
          </View>
          {!vendor.is_open && <Text style={{ color: c.danger, fontWeight: '600' }}>Currently closed</Text>}
        </View>

        {groups.map((group) => (
          <View key={group.name} style={{ paddingHorizontal: Spacing.three, marginTop: Spacing.two }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: Spacing.two }}>{group.name}</Text>
            <View style={{ gap: Spacing.two }}>
              {group.items.map((item) => (
                <MenuRow key={item.id} item={item} vendor={vendor} />
              ))}
            </View>
          </View>
        ))}

        <View style={{ paddingHorizontal: Spacing.three, marginTop: Spacing.four }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: Spacing.two }}>Reviews</Text>
          <VendorReviews idOrSlug={id} />
        </View>
      </ScrollView>

      {count > 0 && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: Spacing.three, backgroundColor: c.card, borderTopWidth: 1, borderTopColor: c.border }}>
          <Button
            title={`Review order · ${count} item(s) · ${money(estTotal)}`}
            onPress={() => setReviewing(true)}
            fullWidth
          />
        </View>
      )}

      {reviewing && (
        <CartReviewModal
          vendor={vendor}
          address={deliveryAddress}
          onClose={() => setReviewing(false)}
          onEditAddress={() => {
            setReviewing(false);
            router.push('/addresses');
          }}
          onPlaced={(orderNumber) => {
            setReviewing(false);
            Alert.alert('Order placed', `Your order ${orderNumber} is confirmed.`, [
              { text: 'View orders', onPress: () => router.replace('/orders') },
            ]);
          }}
        />
      )}
    </SafeAreaView>
  );
}

function MenuRow({ item, vendor }: { item: MenuItem; vendor: Vendor }) {
  const c = useTheme();
  const cart = useCartStore();
  const [customizing, setCustomizing] = useState(false);

  const customizable =
    (item.variants?.length ?? 0) > 0 || (item.addons?.filter((a) => a.is_available).length ?? 0) > 0;
  const disabled = !item.is_available || !vendor.is_open;

  // For the inline stepper we track the plain (un-customized) line; customized
  // combos are managed in the cart review sheet.
  const mine = cart.vendorId === vendor.id ? cart.lines.filter((l) => l.itemId === item.id) : [];
  const plainLine = mine.find((l) => l.variantId === null && l.addonIds.length === 0);
  const totalQty = mine.reduce((n, l) => n + l.quantity, 0);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{item.name}</Text>
        {!!item.description && <Text numberOfLines={2} style={{ color: c.textSecondary, fontSize: 13 }}>{item.description}</Text>}
        <Text style={{ color: c.brand, fontWeight: '700', marginTop: 4 }}>{money(item.price)}</Text>
        {customizable && <Text style={{ color: c.textSecondary, fontSize: 12 }}>Customizable</Text>}
      </View>

      {customizable ? (
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Pressable
            onPress={() => setCustomizing(true)}
            disabled={disabled}
            style={{ paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: disabled ? c.backgroundElement : c.brand }}
          >
            <Text style={{ color: disabled ? c.textSecondary : '#fff', fontWeight: '600' }}>
              {item.is_available ? 'Choose' : 'Sold out'}
            </Text>
          </Pressable>
          {totalQty > 0 && <Text style={{ color: c.textSecondary, fontSize: 12 }}>{totalQty} in cart</Text>}
        </View>
      ) : plainLine ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Pressable onPress={() => cart.setQuantity(plainLine.key, plainLine.quantity - 1)} hitSlop={8}>
            <Ionicons name="remove-circle" size={28} color={c.brand} />
          </Pressable>
          <Text style={{ color: c.text, fontWeight: '700', minWidth: 18, textAlign: 'center' }}>{plainLine.quantity}</Text>
          <Pressable onPress={() => cart.add(vendor.id, vendor.name, item)} hitSlop={8}>
            <Ionicons name="add-circle" size={28} color={c.brand} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={() => cart.add(vendor.id, vendor.name, item)}
          disabled={disabled}
          style={{ paddingHorizontal: 14, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: disabled ? c.backgroundElement : c.brand }}
        >
          <Text style={{ color: disabled ? c.textSecondary : '#fff', fontWeight: '600' }}>
            {item.is_available ? 'Add' : 'Sold out'}
          </Text>
        </Pressable>
      )}

      {customizing && (
        <CustomizeSheet
          item={item}
          onClose={() => setCustomizing(false)}
          onAdd={(selection) => cart.add(vendor.id, vendor.name, item, selection)}
        />
      )}
    </View>
  );
}
