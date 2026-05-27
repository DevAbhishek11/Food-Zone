import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { StoryBar } from '@/components/story-bar';
import { Button, EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCreatePost, useFeed } from '@/lib/hooks';
import { useMediaUpload } from '@/lib/use-media';

export default function FeedScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching, fetchNextPage, hasNextPage } = useFeed();
  const createPost = useCreatePost();
  const { pickAndUpload, uploading } = useMediaUpload();
  const [body, setBody] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const posts = data?.pages.flatMap((p) => p.data) ?? [];

  const attach = async () => {
    const url = await pickAndUpload('post');
    if (url) setImage(url);
  };

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed && !image) return;
    try {
      await createPost.mutateAsync({ body: trimmed, media: image ? [{ url: image, type: 'image' }] : undefined });
      setBody('');
      setImage(null);
    } catch {
      // surfaced by mutation; keep input
    }
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Feed</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.three }}>
          <Pressable onPress={() => router.push('/search')} hitSlop={10}>
            <Ionicons name="search" size={22} color={c.text} />
          </Pressable>
          <Pressable onPress={() => router.push('/messages')} hitSlop={10}>
            <Ionicons name="chatbubbles-outline" size={22} color={c.text} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Couldn't load your feed." onRetry={refetch} />
      ) : (
        <FlashList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: Spacing.three }}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.three }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.brand} />}
          onEndReached={() => hasNextPage && fetchNextPage()}
          onEndReachedThreshold={0.5}
          renderItem={({ item }) => <PostCard post={item} />}
          ListHeaderComponent={
            <View style={{ gap: Spacing.three, marginBottom: Spacing.three }}>
              <View style={{ marginHorizontal: -Spacing.three }}>
                <StoryBar />
              </View>
              <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.two }}>
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Share something tasty…"
                placeholderTextColor={c.textSecondary}
                multiline
                style={{ color: c.text, minHeight: 44, fontSize: 15 }}
              />
              {image && (
                <View>
                  <Image source={{ uri: image }} style={{ width: '100%', height: 180, borderRadius: 10 }} contentFit="cover" />
                  <Pressable onPress={() => setImage(null)} style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#000000aa', borderRadius: 999, padding: 4 }}>
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={attach} disabled={uploading} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={uploading ? 'hourglass-outline' : 'image-outline'} size={20} color={c.brand} />
                  <Text style={{ color: c.brand, fontWeight: '600' }}>{uploading ? 'Uploading…' : 'Photo'}</Text>
                </Pressable>
                <Button title="Post" onPress={submit} loading={createPost.isPending} disabled={!body.trim() && !image} />
              </View>
              </View>
            </View>
          }
          ListEmptyComponent={<EmptyView title="Your feed is empty" hint="Follow people or create your first post." />}
        />
      )}
    </SafeAreaView>
  );
}
