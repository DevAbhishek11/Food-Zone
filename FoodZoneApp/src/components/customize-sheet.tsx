import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { CartSelection } from '@/lib/cart-store';
import { money } from '@/lib/format';
import type { MenuItem } from '@/lib/types';

/**
 * Lets the user choose a variant + add-ons for a menu item before adding it to
 * the cart. Calls onAdd with the resolved selection (unit price + label).
 */
export function CustomizeSheet({
  item,
  onAdd,
  onClose,
}: {
  item: MenuItem;
  onAdd: (selection: CartSelection) => void;
  onClose: () => void;
}) {
  const c = useTheme();
  const variants = useMemo(() => item.variants ?? [], [item.variants]);
  const addons = useMemo(() => (item.addons ?? []).filter((a) => a.is_available), [item.addons]);

  const [variantId, setVariantId] = useState<number | null>(
    variants.find((v) => v.is_default)?.id ?? variants[0]?.id ?? null,
  );
  const [addonIds, setAddonIds] = useState<number[]>([]);

  const { unitPrice, label } = useMemo(() => {
    const variant = variants.find((v) => v.id === variantId);
    const chosen = addons.filter((a) => addonIds.includes(a.id));
    const price = item.price + (variant?.price_modifier ?? 0) + chosen.reduce((n, a) => n + a.price, 0);
    const parts = [variant?.name, ...chosen.map((a) => a.name)].filter(Boolean) as string[];
    return { unitPrice: price, label: parts.join(' · ') || undefined };
  }, [item.price, variants, addons, variantId, addonIds]);

  const toggleAddon = (id: number) =>
    setAddonIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const Option = ({ selected, name, price, kind, onPress }: { selected: boolean; name: string; price: string; kind: 'radio' | 'check'; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: selected ? c.brand : c.border, borderRadius: 12, padding: Spacing.three }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Ionicons
          name={kind === 'radio' ? (selected ? 'radio-button-on' : 'radio-button-off') : selected ? 'checkbox' : 'square-outline'}
          size={20}
          color={selected ? c.brand : c.textSecondary}
        />
        <Text style={{ color: c.text }}>{name}</Text>
      </View>
      <Text style={{ color: c.textSecondary }}>{price}</Text>
    </Pressable>
  );

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: c.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.four, maxHeight: '85%', gap: Spacing.three }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, paddingRight: Spacing.two }}>
              <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{item.name}</Text>
              {!!item.description && <Text style={{ color: c.textSecondary, fontSize: 13 }}>{item.description}</Text>}
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={c.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={{ maxHeight: 360 }} contentContainerStyle={{ gap: Spacing.three }}>
            {variants.length > 0 && (
              <View style={{ gap: Spacing.two }}>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>Choose one</Text>
                {variants.map((v) => (
                  <Option
                    key={v.id}
                    kind="radio"
                    selected={variantId === v.id}
                    name={v.name}
                    price={v.price_modifier ? `+${money(v.price_modifier)}` : '—'}
                    onPress={() => setVariantId(v.id)}
                  />
                ))}
              </View>
            )}

            {addons.length > 0 && (
              <View style={{ gap: Spacing.two }}>
                <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase' }}>Add-ons</Text>
                {addons.map((a) => (
                  <Option
                    key={a.id}
                    kind="check"
                    selected={addonIds.includes(a.id)}
                    name={a.name}
                    price={`+${money(a.price)}`}
                    onPress={() => toggleAddon(a.id)}
                  />
                ))}
              </View>
            )}
          </ScrollView>

          <Button
            title={`Add · ${money(unitPrice)}`}
            fullWidth
            onPress={() => {
              onAdd({ variantId, addonIds, unitPrice, label });
              onClose();
            }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
