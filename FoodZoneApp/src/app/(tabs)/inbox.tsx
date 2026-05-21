import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useMarkAllRead, useMarkRead, useNotifications } from '@/lib/hooks';
import type { AppNotification } from '@/lib/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

function iconFor(type: string): IoniconName {
  if (type === 'like') return 'heart';
  if (type === 'comment') return 'chatbubble';
  if (type === 'follow' || type === 'follow_request') return 'person-add';
  if (type.startsWith('order')) return 'receipt';
  return 'notifications';
}

export default function InboxScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.pages.flatMap((p) => p.data) ?? [];
  const hasUnread = items.some((n) => !n.is_read);

  const open = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.data?.order_id) router.push('/orders');
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Inbox</Text>
        {hasUnread && (
          <Pressable onPress={() => markAllRead.mutate()} hitSlop={8}>
            <Text style={{ color: c.brand, fontWeight: '600' }}>Mark all read</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load notifications." onRetry={refetch} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => String(n.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.brand} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="You're all caught up" hint="Likes, comments, follows and order updates appear here." />}
          renderItem={({ item }) => {
            const actor = item.data?.actor;
            return (
              <Pressable
                onPress={() => open(item)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: Spacing.two,
                  backgroundColor: item.is_read ? c.card : c.brand + '14',
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: c.border,
                  padding: Spacing.three,
                }}
              >
                {actor ? (
                  <Avatar uri={actor.avatar} name={actor.name} size={40} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={iconFor(item.type)} size={20} color={c.brand} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{item.title}</Text>
                  {!!item.message && <Text style={{ color: c.textSecondary, fontSize: 13 }}>{item.message}</Text>}
                  <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>{timeAgo(item.created_at)}</Text>
                </View>
                {!item.is_read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.brand, marginTop: 6 }} />}
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
