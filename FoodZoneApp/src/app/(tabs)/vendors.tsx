import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { money } from '@/lib/format';
import { useVendors } from '@/lib/hooks';
import type { Vendor } from '@/lib/types';

export default function VendorsScreen() {
  const c = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useVendors(search);

  const vendors = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border, gap: Spacing.two }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Order Food</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing.two }}>
          <Ionicons name="search" size={18} color={c.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants…"
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, height: 42, color: c.text }}
            autoCapitalize="none"
          />
        </View>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load restaurants." onRetry={refetch} />
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="No restaurants found" hint="Try a different search." />}
          renderItem={({ item }) => <VendorCard vendor={item} onPress={() => router.push(`/vendor/${item.slug}`)} />}
        />
      )}
    </SafeAreaView>
  );
}

function VendorCard({ vendor, onPress }: { vendor: Vendor; onPress: () => void }) {
  const c = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ height: 120, backgroundColor: c.backgroundElement }}>
        {vendor.banner ? (
          <Image source={{ uri: vendor.banner }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: c.border, fontSize: 40, fontWeight: '800' }}>{vendor.name.charAt(0)}</Text>
          </View>
        )}
        {!vendor.is_open && (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: c.danger, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>Closed</Text>
          </View>
        )}
      </View>
      <View style={{ padding: Spacing.three, gap: 4 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 16 }}>{vendor.name}</Text>
        {!!vendor.description && (
          <Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 13 }}>{vendor.description}</Text>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, marginTop: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="star" size={14} color={c.warning} />
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {vendor.rating_avg > 0 ? vendor.rating_avg.toFixed(1) : 'New'}
            </Text>
          </View>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>{vendor.prep_time_minutes} min</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {vendor.delivery_fee > 0 ? `${money(vendor.delivery_fee)} delivery` : 'Free delivery'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
