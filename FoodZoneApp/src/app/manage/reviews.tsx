import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Stars } from '@/components/stars';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useReplyReview, useVendorReviewsAdmin } from '@/lib/hooks';
import type { Review } from '@/lib/types';

export default function ManageReviewsScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useVendorReviewsAdmin();
  const reviews = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Reviews</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load reviews." onRetry={refetch} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="No reviews yet" hint="Customer reviews appear here." />}
          renderItem={({ item }) => <ReviewRow review={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function ReviewRow({ review }: { review: Review }) {
  const c = useTheme();
  const reply = useReplyReview();
  const [text, setText] = useState('');

  const submit = () => {
    if (!text.trim()) return;
    reply.mutate(
      { ratingId: review.id, reply: text.trim() },
      { onError: () => Alert.alert('Error', 'Could not post reply.') },
    );
  };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
        <Avatar uri={review.user?.avatar} name={review.user?.name ?? 'User'} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '600' }}>{review.user?.name ?? 'Customer'}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 11 }}>{timeAgo(review.created_at)}</Text>
        </View>
        <Stars value={review.rating} />
      </View>
      {!!review.review && <Text style={{ color: c.text }}>{review.review}</Text>}

      {review.vendor_reply ? (
        <View style={{ borderLeftWidth: 2, borderLeftColor: c.brand, backgroundColor: c.backgroundElement, padding: Spacing.two, borderRadius: 8 }}>
          <Text style={{ color: c.brand, fontSize: 11, fontWeight: '700' }}>Your reply</Text>
          <Text style={{ color: c.text }}>{review.vendor_reply}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: 4 }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a reply…"
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, height: 40, borderWidth: 1, borderColor: c.border, borderRadius: 10, paddingHorizontal: Spacing.three, color: c.text }}
          />
          <Button title="Reply" onPress={submit} loading={reply.isPending} />
        </View>
      )}
    </View>
  );
}
