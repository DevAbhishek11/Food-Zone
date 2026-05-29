import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useGroupedNotifications, useMarkAllRead, useMarkRead } from '@/lib/hooks';
import type { AppNotification } from '@/lib/types';

type IoniconName = keyof typeof Ionicons.glyphMap;

function iconFor(type: string): IoniconName {
  if (type === 'like') return 'heart';
  if (type === 'comment') return 'chatbubble';
  if (type === 'follow' || type === 'follow_request') return 'person-add';
  if (type === 'mention' || type === 'story_mention') return 'at';
  if (type === 'post_tagged') return 'pricetag';
  if (type === 'vendor_offer') return 'storefront';
  if (type === 'flash_deal') return 'flame';
  if (type === 'system') return 'sparkles';
  if (type.startsWith('order')) return 'receipt';
  return 'notifications';
}

export default function InboxScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useGroupedNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const all = data ? [...data.today, ...data.this_week, ...data.earlier] : [];
  const hasUnread = all.some((n) => !n.is_read);
  const empty = all.length === 0;

  const open = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.data?.order_id) router.push('/orders');
    else if (n.data?.post_id) router.push(`/post/${n.data.post_id}`);
    else if (n.data?.actor?.username) router.push(`/u/${n.data.actor.username}`);
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
      ) : empty ? (
        <EmptyView title="You're all caught up" hint="Likes, comments, follows and order updates appear here." />
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.brand} />}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
        >
          {data!.today.length > 0 && <Section title="Today" items={data!.today} onOpen={open} />}
          {data!.this_week.length > 0 && <Section title="This week" items={data!.this_week} onOpen={open} />}
          {data!.earlier.length > 0 && <Section title="Earlier" items={data!.earlier} onOpen={open} />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Section({
  title,
  items,
  onOpen,
}: {
  title: string;
  items: AppNotification[];
  onOpen: (n: AppNotification) => void;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: Spacing.two }}>
      <Text style={{ color: c.textSecondary, fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</Text>
      {items.map((item) => {
        const actor = item.data?.actor;
        return (
          <Pressable
            key={item.id}
            onPress={() => onOpen(item)}
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
      })}
    </View>
  );
}
