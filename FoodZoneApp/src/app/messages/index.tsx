import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ActionSheetIOS, Alert, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { timeAgo } from '@/lib/format';
import { useConversations, useMuteConversation, useTogglePinConversation } from '@/lib/hooks';

export default function MessagesScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useConversations();
  const pin = useTogglePinConversation();
  const mute = useMuteConversation();
  const conversations = data?.pages.flatMap((p) => p.data) ?? [];

  const onLongPress = (conv: { id: number; is_pinned?: boolean; is_muted?: boolean }) => {
    const options = [
      conv.is_pinned ? 'Unpin' : 'Pin',
      conv.is_muted ? 'Unmute' : 'Mute for 1 hour',
      'Cancel',
    ];
    const handle = (i: number) => {
      if (options[i] === 'Pin' || options[i] === 'Unpin') pin.mutate(conv.id);
      else if (options[i] === 'Mute for 1 hour') mute.mutate({ conversationId: conv.id, muted: true, minutes: 60 });
      else if (options[i] === 'Unmute') mute.mutate({ conversationId: conv.id, muted: false });
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options, cancelButtonIndex: options.length - 1 }, handle);
    } else {
      const buttons = [
        ...options.slice(0, -1).map((label, i) => ({ text: label, onPress: () => handle(i) })),
        { text: 'Cancel', style: 'cancel' as const },
      ];
      Alert.alert('Conversation', undefined, buttons);
    }
  };

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
        <FlashList
          data={conversations}
          keyExtractor={(c) => String(c.id)}
          contentContainerStyle={{ padding: Spacing.three }}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={<EmptyView title="No messages yet" hint="Start a chat from someone's profile." />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/messages/${item.id}`)}
              onLongPress={() => onLongPress(item)}
              delayLongPress={300}
              style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.three, marginBottom: Spacing.two }}
            >
              <Avatar uri={item.other?.avatar} name={item.other?.name ?? 'User'} size={48} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.is_pinned && <Ionicons name="pin" size={12} color={c.brand} />}
                  <Text style={{ color: c.text, fontWeight: '600', flex: 1 }} numberOfLines={1}>{item.other?.name ?? 'Unknown'}</Text>
                  {item.is_muted && <Ionicons name="notifications-off" size={12} color={c.textSecondary} />}
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
