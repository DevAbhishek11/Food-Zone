import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Post } from '@/lib/types';

export function PostCard({ post }: { post: Post }) {
  const c = useTheme();
  const router = useRouter();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likes, setLikes] = useState(post.likes_count);
  const [busy, setBusy] = useState(false);

  const toggleLike = async () => {
    if (busy) return;
    setBusy(true);
    const next = !liked;
    setLiked(next);
    setLikes((n) => n + (next ? 1 : -1));
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
  };

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
      </Pressable>

      {!!post.body && (
        <Text style={{ color: c.text, paddingHorizontal: Spacing.three, paddingBottom: Spacing.three, lineHeight: 21 }}>
          {post.body}
        </Text>
      )}

      {post.media.length > 0 && (
        <Image source={{ uri: post.media[0].url }} style={{ width: '100%', height: 240 }} contentFit="cover" />
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderTopWidth: 1, borderTopColor: c.border, padding: Spacing.two, paddingHorizontal: Spacing.three }}>
        <Pressable onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? c.brand : c.textSecondary} />
          <Text style={{ color: liked ? c.brand : c.textSecondary }}>{likes}</Text>
        </Pressable>
        <Pressable onPress={() => router.push(`/post/${post.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="chatbubble-outline" size={20} color={c.textSecondary} />
          <Text style={{ color: c.textSecondary }}>{post.comments_count}</Text>
        </Pressable>
      </View>
    </View>
  );
}
