import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { Stars } from '@/components/stars';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useVendorReviews } from '@/lib/hooks';

export function VendorReviews({ idOrSlug }: { idOrSlug: string }) {
  const c = useTheme();
  const { data, isLoading, isError } = useVendorReviews(idOrSlug);
  const reviews = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) return <Text style={{ color: c.textSecondary }}>Loading reviews…</Text>;
  if (isError) return <Text style={{ color: c.textSecondary }}>Couldn&apos;t load reviews.</Text>;
  if (reviews.length === 0) return <Text style={{ color: c.textSecondary }}>No reviews yet.</Text>;

  return (
    <View style={{ gap: Spacing.two }}>
      {reviews.map((r) => (
        <View key={r.id} style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
            <Avatar uri={r.user?.avatar} name={r.user?.name ?? 'User'} size={32} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600' }}>{r.user?.name ?? 'Customer'}</Text>
              <Text style={{ color: c.textSecondary, fontSize: 11 }}>{timeAgo(r.created_at)}</Text>
            </View>
            <Stars value={r.rating} />
          </View>
          {!!r.review && <Text style={{ color: c.text }}>{r.review}</Text>}
          {!!r.vendor_reply && (
            <View style={{ borderLeftWidth: 2, borderLeftColor: c.brand, backgroundColor: c.backgroundElement, padding: Spacing.two, borderRadius: 8 }}>
              <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Owner&apos;s reply</Text>
              <Text style={{ color: c.text }}>{r.vendor_reply}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
}
