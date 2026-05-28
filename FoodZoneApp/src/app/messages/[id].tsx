import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getEcho } from '@/lib/echo';
import { timeAgo } from '@/lib/format';
import { useDeleteMessage, useMarkConversationRead, useMessages, useSendMessage, useToggleReact } from '@/lib/hooks';
import type { Message } from '@/lib/types';

const QUICK_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

export default function ThreadScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Number(id);
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const markRead = useMarkConversationRead(conversationId);
  const react = useToggleReact(conversationId);
  const remove = useDeleteMessage(conversationId);
  const [body, setBody] = useState('');
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [reactingTo, setReactingTo] = useState<Message | null>(null);

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
    const reply = replyTo;
    setBody('');
    setReplyTo(null);
    send.mutate(
      { body: text, replied_to_message_id: reply?.id ?? undefined },
      { onError: () => { setBody(text); setReplyTo(reply); } },
    );
  };

  // Long-press → choose an action. iOS uses native ActionSheet; Android/web a Modal.
  const onLongPress = (msg: Message) => {
    if (msg.is_deleted) return;
    const options = ['React', 'Reply', ...(msg.is_mine ? ['Delete'] : []), 'Cancel'];
    const cancelIdx = options.length - 1;
    const destructiveIdx = msg.is_mine ? options.indexOf('Delete') : undefined;

    const handle = (i: number) => {
      const choice = options[i];
      if (choice === 'React') setReactingTo(msg);
      else if (choice === 'Reply') setReplyTo(msg);
      else if (choice === 'Delete') {
        Alert.alert('Delete message?', undefined, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(msg.id) },
        ]);
      }
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIdx, destructiveButtonIndex: destructiveIdx },
        handle,
      );
    } else {
      setReactingTo(msg); // fallback opens the reaction picker; Reply/Delete via reaction-sheet's own buttons
    }
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
              <Pressable onLongPress={() => onLongPress(item)} delayLongPress={250} style={{ alignSelf: item.is_mine ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: 4 }}>
                {item.replied_to && (
                  <View style={{ borderLeftWidth: 2, borderLeftColor: c.brand, paddingLeft: Spacing.two, opacity: 0.7 }}>
                    <Text style={{ color: c.textSecondary, fontSize: 11 }} numberOfLines={1}>↪ {item.replied_to.body ?? '(deleted)'}</Text>
                  </View>
                )}

                {item.is_deleted ? (
                  <View style={{ backgroundColor: c.backgroundElement, borderRadius: 16, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }}>
                    <Text style={{ color: c.textSecondary, fontStyle: 'italic' }}>This message was deleted</Text>
                  </View>
                ) : (
                  <View style={{ backgroundColor: item.is_mine ? c.brand : c.card, borderRadius: 16, borderWidth: item.is_mine ? 0 : 1, borderColor: c.border, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two }}>
                    <Text style={{ color: item.is_mine ? '#fff' : c.text }}>{item.body}</Text>
                    <Text style={{ color: item.is_mine ? '#ffffffaa' : c.textSecondary, fontSize: 10, marginTop: 2 }}>{timeAgo(item.created_at)}</Text>
                  </View>
                )}

                {item.reactions && item.reactions.length > 0 && (
                  <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                    {item.reactions.map((r) => (
                      <Pressable
                        key={r.emoji}
                        onPress={() => react.mutate({ messageId: item.id, emoji: r.emoji })}
                        style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, borderWidth: 1, borderColor: r.mine ? c.brand : c.border, backgroundColor: r.mine ? c.brand + '22' : c.backgroundElement }}
                      >
                        <Text style={{ color: c.text, fontSize: 12 }}>{r.emoji} {r.count}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </Pressable>
            )}
          />

          {replyTo && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.backgroundElement }}>
              <Ionicons name="arrow-undo" size={14} color={c.brand} />
              <Text numberOfLines={1} style={{ flex: 1, color: c.textSecondary, fontSize: 12 }}>
                Replying to {replyTo.is_mine ? 'yourself' : `@${replyTo.sender?.username ?? 'user'}`}: {replyTo.body}
              </Text>
              <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                <Ionicons name="close" size={16} color={c.textSecondary} />
              </Pressable>
            </View>
          )}

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

      {/* Reaction picker (also used as the action sheet on non-iOS via Reply/Delete buttons). */}
      <Modal transparent animationType="fade" visible={!!reactingTo} onRequestClose={() => setReactingTo(null)}>
        <Pressable onPress={() => setReactingTo(null)} style={{ flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' }}>
          <Pressable onPress={() => {}} style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.four, gap: Spacing.three }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              {QUICK_REACTIONS.map((e) => (
                <Pressable
                  key={e}
                  onPress={() => {
                    if (reactingTo) react.mutate({ messageId: reactingTo.id, emoji: e });
                    setReactingTo(null);
                  }}
                  style={{ padding: Spacing.two }}
                >
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </Pressable>
              ))}
            </View>
            {Platform.OS !== 'ios' && reactingTo && (
              <View style={{ gap: Spacing.two, borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.three }}>
                <Pressable onPress={() => { setReplyTo(reactingTo); setReactingTo(null); }} style={{ padding: Spacing.three }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>Reply</Text>
                </Pressable>
                {reactingTo.is_mine && (
                  <Pressable
                    onPress={() => {
                      const id = reactingTo.id;
                      setReactingTo(null);
                      Alert.alert('Delete message?', undefined, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: () => remove.mutate(id) },
                      ]);
                    }}
                    style={{ padding: Spacing.three }}
                  >
                    <Text style={{ color: c.danger, fontWeight: '600' }}>Delete</Text>
                  </Pressable>
                )}
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
