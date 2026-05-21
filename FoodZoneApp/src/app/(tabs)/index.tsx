import { useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCreatePost, useFeed } from '@/lib/hooks';

export default function FeedScreen() {
  const c = useTheme();
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage } = useFeed();
  const createPost = useCreatePost();
  const [body, setBody] = useState('');

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    try {
      await createPost.mutateAsync(trimmed);
      setBody('');
    } catch {
      // surfaced by mutation; keep input
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Feed</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load your feed." onRetry={refetch} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.brand} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={
            <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.three }}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Share something tasty…"
                placeholderTextColor={c.textSecondary}
                multiline
                style={{ color: c.text, minHeight: 44, fontSize: 15 }}
              />
              <View style={{ alignItems: 'flex-end' }}>
                <Button title="Post" onPress={submit} loading={createPost.isPending} disabled={!body.trim()} />
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyView title="Your feed is empty" hint="Follow people or create your first post." />}
        />
      )}
    </SafeAreaView>
  );
}
