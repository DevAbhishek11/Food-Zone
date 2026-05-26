import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { timeAgo } from '@/lib/format';
import { useAddComment, useComments, useDeleteComment, usePost } from '@/lib/hooks';
import type { Comment } from '@/lib/types';

export default function PostDetailScreen() {
  const c = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const postId = Number(id);

  const post = usePost(postId);
  const comments = useComments(postId);
  const addComment = useAddComment(postId);
  const [body, setBody] = useState('');

  const topLevel = comments.data ?? [];

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ body: trimmed });
      setBody('');
    } catch (e) {
      Alert.alert('Could not comment', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Post</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
        {post.isLoading ? (
          <Loading />
        ) : post.isError || !post.data ? (
          <ErrorView message="Couldn't load this post." onRetry={post.refetch} />
        ) : (
          <FlatList
            data={topLevel}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
            ListHeaderComponent={
              <View style={{ gap: Spacing.two, paddingBottom: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
                  <Avatar uri={post.data.author.avatar} name={post.data.author.name} size={40} />
                  <View>
                    <Text style={{ color: c.text, fontWeight: '600' }}>{post.data.author.name}</Text>
                    <Text style={{ color: c.textSecondary, fontSize: 12 }}>@{post.data.author.username} · {timeAgo(post.data.created_at)}</Text>
                  </View>
                </View>
                {!!post.data.body && <Text style={{ color: c.text, lineHeight: 21 }}>{post.data.body}</Text>}
                {post.data.media.length > 0 && (
                  <Image source={{ uri: post.data.media[0].url }} style={{ width: '100%', height: 240, borderRadius: 12 }} contentFit="cover" />
                )}
                <Text style={{ color: c.textSecondary, fontSize: 13, fontWeight: '600', marginTop: Spacing.two }}>
                  Comments ({post.data.comments_count})
                </Text>
              </View>
            }
            ListEmptyComponent={comments.isLoading ? <Loading /> : <EmptyView title="No comments yet" hint="Be the first to comment." />}
            renderItem={({ item }) => <CommentRow comment={item} postId={postId} />}
          />
        )}

        <View style={{ flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, borderTopWidth: 1, borderTopColor: c.border, alignItems: 'center' }}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write a comment…"
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 20, paddingHorizontal: Spacing.three, height: 40, color: c.text }}
          />
          <Pressable onPress={submit} disabled={!body.trim() || addComment.isPending} hitSlop={8}>
            <Ionicons name="send" size={22} color={body.trim() ? c.brand : c.textSecondary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CommentRow({ comment, postId }: { comment: Comment; postId: number }) {
  const c = useTheme();
  const me = useAuthStore((s) => s.user);
  const addComment = useAddComment(postId);
  const deleteComment = useDeleteComment(postId);
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState('');

  const isTopLevel = comment.parent_id === null;
  const canDelete = me?.id === comment.author.id || me?.role === 'admin' || me?.role === 'super_admin';

  const submitReply = async () => {
    const trimmed = replyBody.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync({ body: trimmed, parentId: comment.id });
      setReplyBody('');
      setReplying(false);
    } catch (e) {
      Alert.alert('Could not reply', e instanceof ApiError ? e.message : 'Try again.');
    }
  };

  const remove = () =>
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment.mutate(comment.id) },
    ]);

  return (
    <View style={{ flexDirection: 'row', gap: Spacing.two }}>
      <Avatar uri={comment.author.avatar} name={comment.author.name} size={28} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ backgroundColor: c.backgroundElement, borderRadius: 14, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, alignSelf: 'flex-start' }}>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>@{comment.author.username} · {timeAgo(comment.created_at)}</Text>
          <Text style={{ color: c.text }}>{comment.body}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: Spacing.three, paddingLeft: 4 }}>
          {isTopLevel && (
            <Pressable onPress={() => setReplying((v) => !v)}>
              <Text style={{ color: c.textSecondary, fontSize: 12, fontWeight: '600' }}>Reply</Text>
            </Pressable>
          )}
          {canDelete && (
            <Pressable onPress={remove}>
              <Text style={{ color: c.danger, fontSize: 12, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          )}
        </View>

        {replying && (
          <View style={{ flexDirection: 'row', gap: Spacing.two, alignItems: 'center' }}>
            <TextInput
              value={replyBody}
              onChangeText={setReplyBody}
              placeholder={`Reply to @${comment.author.username}…`}
              placeholderTextColor={c.textSecondary}
              autoFocus
              style={{ flex: 1, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: Spacing.three, height: 36, color: c.text }}
            />
            <Pressable onPress={submitReply} disabled={!replyBody.trim() || addComment.isPending} hitSlop={8}>
              <Ionicons name="send" size={20} color={replyBody.trim() ? c.brand : c.textSecondary} />
            </Pressable>
          </View>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <View style={{ gap: Spacing.two, borderLeftWidth: 1, borderLeftColor: c.border, paddingLeft: Spacing.two, marginTop: 4 }}>
            {comment.replies.map((r) => (
              <CommentRow key={r.id} comment={r} postId={postId} />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
