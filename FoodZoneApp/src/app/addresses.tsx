import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AddressInput, useAddresses, useSaveAddress } from '@/lib/hooks';
import type { Address } from '@/lib/types';

const EMPTY: AddressInput = { label: 'Home', address: '', city: '', state: '', pincode: '', landmark: '' };

export default function AddressesScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useAddresses();
  const { create, update, remove } = useSaveAddress();
  const [form, setForm] = useState<AddressInput | null>(null);

  const set = (k: keyof AddressInput) => (v: string) => setForm((p) => ({ ...(p ?? EMPTY), [k]: v }));

  const submit = () => {
    if (!form) return;
    if (!form.address.trim() || !form.city.trim() || !form.state.trim() || !form.pincode.trim()) {
      Alert.alert('Missing fields', 'Address, city, state and pincode are required.');
      return;
    }
    create.mutate(form, {
      onSuccess: () => setForm(null),
      onError: () => Alert.alert('Error', 'Could not save address.'),
    });
  };

  const addresses = data ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.two }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={c.text} />
          </Pressable>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Addresses</Text>
        </View>
        {!form && <Button title="Add" onPress={() => setForm(EMPTY)} />}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load addresses." onRetry={refetch} />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          ListHeaderComponent={
            form ? (
              <View style={{ gap: Spacing.two, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.brand, padding: Spacing.three, marginBottom: Spacing.three }}>
                <Field c={c} label="Label" value={form.label ?? ''} onChange={set('label')} />
                <Field c={c} label="Address" value={form.address} onChange={set('address')} />
                <Field c={c} label="City" value={form.city} onChange={set('city')} />
                <Field c={c} label="State" value={form.state} onChange={set('state')} />
                <Field c={c} label="Pincode" value={form.pincode} onChange={set('pincode')} keyboardType="number-pad" />
                <Field c={c} label="Landmark (optional)" value={form.landmark ?? ''} onChange={set('landmark')} />
                <View style={{ flexDirection: 'row', gap: Spacing.two }}>
                  <Button title="Save" onPress={submit} loading={create.isPending} />
                  <Button title="Cancel" variant="secondary" onPress={() => setForm(null)} />
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={!form ? <EmptyView title="No saved addresses" hint="Add one to speed up checkout." /> : null}
          renderItem={({ item }: { item: Address }) => (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}>
              <Ionicons name="location-outline" size={20} color={c.textSecondary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>
                  {item.label}{item.is_default ? '  ·  Default' : ''}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 13 }}>{item.address}, {item.city}, {item.state} {item.pincode}</Text>
                {!item.is_default && (
                  <Pressable onPress={() => update.mutate({ id: item.id, body: { label: item.label, address: item.address, city: item.city, state: item.state, pincode: item.pincode, landmark: item.landmark ?? undefined, is_default: true } })}>
                    <Text style={{ color: c.brand, fontSize: 12, marginTop: 4 }}>Set as default</Text>
                  </Pressable>
                )}
              </View>
              <Pressable onPress={() => remove.mutate(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={c.danger} />
              </Pressable>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Field({ c, label, value, onChange, keyboardType }: { c: ReturnType<typeof useTheme>; label: string; value: string; onChange: (v: string) => void; keyboardType?: 'default' | 'number-pad' }) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: c.textSecondary, fontSize: 13 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? 'default'}
        placeholderTextColor={c.textSecondary}
        style={{ height: 42, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: Spacing.three, color: c.text }}
      />
    </View>
  );
}
