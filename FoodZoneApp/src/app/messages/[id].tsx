import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getEcho } from '@/lib/echo';
import { timeAgo } from '@/lib/format';
import { useMarkConversationRead, useMessages, useSendMessage } from '@/lib/hooks';

export default function ThreadScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const [body, setBody] = useState('');

  // API returns newest-first → inverted FlatList shows newest at the bottom.
  const messages = data?.pages.flatMap((p) => p.data) ?? [];
  const other = messages.find((m) => !m.is_mine)?.sender;

  useEffect(() => {
    markRead.mutate();
    let active = true;
    const channel = `conversation.${conversationId}`;
    getEcho().then((echo) => {
      if (!echo || !active) return;
      echo.private(channel).listen('.message.sent', () => {
        qc.invalidateQueries({ queryKey: ['messages', conversationId] });
        markRead.mutate();
      });
    });
    return () => {
      active = false;
      getEcho().then((echo) => echo?.leave(channel));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const submit = () => {
    const text = body.trim();
    if (!text) return;
    setBody('');
    send.mutate(text, { onError: () => setBody(text) });
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{other?.name ?? 'Conversation'}</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load this conversation." onRetry={refetch} />
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
          <FlatList
            data={messages}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}
            onEndReached={() => hasNextPage && fetchNextPage()}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={<Text style={{ color: c.textSecondary, textAlign: 'center', marginTop: Spacing.five }}>Say hello 👋</Text>}
            renderItem={({ item }) => (
              <View style={{ alignSelf: item.is_mine ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
                <View style={{ backgroundColor: item.is_mine ? c.brand : c.card, borderRadius: 16, borderWidth: item.is_mine ? 0 : 1, borderColor: c.border, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }}>
                  <Text style={{ color: item.is_mine ? '#fff' : c.text }}>{item.body}</Text>
                  <Text style={{ color: item.is_mine ? '#ffffffaa' : c.textSecondary, fontSize: 10, marginTop: 2 }}>{timeAgo(item.created_at)}</Text>
                </View>
              </View>
            )}
          />

          <View style={{ flexDirection: 'row', gap: Spacing.two, padding: Spacing.two, borderTopWidth: 1, borderTopColor: c.border }}>
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Type a message…"
              placeholderTextColor={c.textSecondary}
              style={{ flex: 1, height: 44, borderWidth: 1, borderColor: c.border, borderRadius: 22, paddingHorizontal: Spacing.three, color: c.text }}
            />
            <Pressable
              onPress={submit}
              disabled={!body.trim() || send.isPending}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: c.brand, alignItems: 'center', justifyContent: 'center', opacity: !body.trim() ? 0.5 : 1 }}
            >
              <Ionicons name="send" size={18} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}
