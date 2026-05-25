import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useConversations } from '@/lib/hooks';

export default function MessagesScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useConversations();
  const conversations = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Messages</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load conversations." onRetry={refetch} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="No messages yet" hint="Start a chat from someone's profile." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/messages/${item.id}`)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}
            >
              <Avatar uri={item.other?.avatar} name={item.other?.name ?? 'User'} size={48} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{item.other?.name ?? 'Unknown'}</Text>
                  {item.last_message && <Text style={{ color: c.textSecondary, fontSize: 11 }}>{timeAgo(item.last_message.created_at)}</Text>}
                </View>
                <Text numberOfLines={1} style={{ color: item.unread > 0 ? c.text : c.textSecondary, fontSize: 13 }}>
                  {item.last_message ? `${item.last_message.is_mine ? 'You: ' : ''}${item.last_message.body}` : 'No messages yet'}
                </Text>
              </View>
              {item.unread > 0 && (
                <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{item.unread}</Text>
                </View>
              )}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
