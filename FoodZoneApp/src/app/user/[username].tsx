import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Avatar, Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { useStartConversation, useToggleFollow, useUserPosts, useUserProfile } from '@/lib/hooks';

export default function UserProfileScreen() {
  const c = useTheme();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();
  const me = useAuthStore((s) => s.user);
  const { data: user, isLoading, isError, refetch } = useUserProfile(username);
  const posts = useUserPosts(username);
  const { follow, unfollow } = useToggleFollow(username);
  const startConversation = useStartConversation();

  const messageUser = (userId: number) =>
    startConversation.mutate(userId, { onSuccess: (res) => router.push(`/messages/${res.data.id}`) });

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <Loading />
      </SafeAreaView>
    );
  }
  if (isError || !user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
        <ErrorView message="This user could not be found." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const isSelf = me?.id === user.id;
  const following = !!user.is_following;
  const postList = posts.data?.pages.flatMap((p) => p.data) ?? [];

  const Header = (
    <View style={{ gap: Spacing.three, marginBottom: Spacing.three }}>
      <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.four, gap: Spacing.three }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.three }}>
          <Avatar uri={user.profile?.avatar} name={user.name} size={64} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>{user.name}</Text>
            <Text style={{ color: c.textSecondary }}>@{user.username}</Text>
          </View>
          {!isSelf && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Pressable
                onPress={() => messageUser(user.id)}
                style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="chatbubble-outline" size={18} color={c.text} />
              </Pressable>
              <Button
                title={following ? 'Following' : user.profile?.is_private ? 'Request' : 'Follow'}
                variant={following ? 'secondary' : 'primary'}
                loading={follow.isPending || unfollow.isPending}
                onPress={() => (following ? unfollow.mutate(user.id) : follow.mutate(user.id))}
              />
            </View>
          )}
        </View>

        {!!user.profile?.bio && <Text style={{ color: c.text }}>{user.profile.bio}</Text>}

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: c.border, paddingTop: Spacing.three }}>
          <Stat label="Posts" value={user.profile?.posts_count ?? 0} c={c} />
          <Stat label="Followers" value={user.profile?.followers_count ?? 0} c={c} />
          <Stat label="Following" value={user.profile?.following_count ?? 0} c={c} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>@{user.username}</Text>
      </View>

      <FlatList
        data={postList}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
        ListHeaderComponent={Header}
        onEndReached={() => posts.hasNextPage && posts.fetchNextPage()}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => <PostCard post={item} />}
        ListEmptyComponent={
          <EmptyView
            title="No posts yet"
            hint={isSelf ? 'Share your first post from the feed.' : "This user hasn't posted, or their posts are private."}
          />
        }
      />
    </SafeAreaView>
  );
}

function Stat({ label, value, c }: { label: string; value: number; c: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{value}</Text>
      <Text style={{ color: c.textSecondary, fontSize: 12 }}>{label}</Text>
    </View>
  );
}
