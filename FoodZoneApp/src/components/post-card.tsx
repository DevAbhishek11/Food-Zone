import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { memo, useCallback, useRef, useState } from 'react';
import { Animated, Pressable, Share, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import { useSharePost, useToggleSave } from '@/lib/hooks';
import type { Post } from '@/lib/types';

function PostCardBase({ post }: { post: Post }) {
  const c = useTheme();
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [saved, setSaved] = useState(!!post.is_saved);
  const [shares, setShares] = useState(post.shares_count);
  const [busy, setBusy] = useState(false);

  const toggleSave = useToggleSave();
  const sharePost = useSharePost();

  // Heart-burst animation for double-tap likes.
  const burst = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(0);

  const setLike = useCallback(
    async (next: boolean) => {
      if (busy || next === liked) return;
      setBusy(true);
      setLiked(next);
      setLikes((n) => n + (next ? 1 : -1));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      try {
        const res = next
          ? await api.post<{ likes_count: number }>(`/posts/${post.id}/like`)
          : await api.del<{ likes_count: number }>(`/posts/${post.id}/like`);
        setLikes(res.data.likes_count);
      } catch {
        setLiked(!next);
        setLikes((n) => n + (next ? -1 : 1));
      } finally {
        setBusy(false);
      }
    },
    [busy, liked, post.id],
  );

  const onMediaTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      void setLike(true);
      burst.setValue(0);
      Animated.sequence([
        Animated.spring(burst, { toValue: 1, useNativeDriver: true, friction: 4 }),
        Animated.timing(burst, { toValue: 0, duration: 350, delay: 250, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  }, [burst, setLike]);

  const onSave = useCallback(() => {
    const next = !saved;
    setSaved(next);
    toggleSave.mutate({ postId: post.id, saved: !next }, { onError: () => setSaved(!next) });
  }, [saved, post.id, toggleSave]);

  const onShare = useCallback(async () => {
    try {
      const res = await sharePost.mutateAsync(post.id);
      setShares(res.data.shares_count);
      await Share.share({ message: `Check out this post on FoodZone` });
    } catch {
      // user dismissed the share sheet or request failed — non-fatal
    }
  }, [post.id, sharePost]);

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}>
      <Pressable
        onPress={() => router.push(`/user/${post.author.username}`)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three }}
      >
        <Avatar uri={post.author.avatar} name={post.author.name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.text, fontWeight: '600' }}>{post.author.name}</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            @{post.author.username} · {timeAgo(post.created_at)}
          </Text>
        </View>
        {post.source === 'suggested' && (
          <Text style={{ color: c.textSecondary, fontSize: 10, fontWeight: '600', textTransform: 'uppercase' }}>Suggested</Text>
        )}
      </Pressable>

      {!!post.body && (
        <Text style={{ color: c.text, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, lineHeight: 21 }}>
          {post.body}
        </Text>
      )}

      {post.media.length > 0 && (
        <Pressable onPress={onMediaTap}>
          <Image source={{ uri: post.media[0].url }} style={{ width: '100%', height: 240 }} contentFit="cover" />
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              alignSelf: 'center',
              top: 90,
              opacity: burst,
              transform: [{ scale: burst.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.4] }) }],
            }}
          >
            <Ionicons name="heart" size={72} color="#fff" />
          </Animated.View>
        </Pressable>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.four, borderTopWidth: 1, borderTopColor: c.border, padding: Spacing.two, paddingHorizontal: Spacing.three }}>
        <Pressable onPress={() => setLike(!liked)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? c.brand : c.textSecondary} />
          <Text style={{ color: liked ? c.brand : c.textSecondary }}>{likes}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/post/${post.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={20} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary }}>{post.comments_count}</Text>
        </Pressable>
        <Pressable onPress={onShare} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="share-social-outline" size={20} color={c.textSecondary} />
          {shares > 0 && <Text style={{ color: c.textSecondary }}>{shares}</Text>}
        </Pressable>
        <Pressable onPress={onSave} style={{ marginLeft: 'auto' }} hitSlop={8}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? c.brand : c.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

export const PostCard = memo(PostCardBase);
