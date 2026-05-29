import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/post-card';
import { Avatar, EmptyView } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { useTheme } from '@/hooks/use-theme';
import { useCombinedSearch, useTypedSearch } from '@/lib/hooks';
import type { Post, User, Vendor } from '@/lib/types';

type Tab = 'all' | 'users' | 'vendors' | 'posts';
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'users', label: 'People' },
  { id: 'vendors', label: 'Food' },
  { id: 'posts', label: 'Posts' },
];

export default function SearchScreen() {
  const c = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const q = useDebounce(query.trim());
  const ready = q.length >= 2;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing.two }}>
          <Ionicons name="search" size={18} color={c.textSecondary} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            placeholder="Search FoodZone…"
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, height: 42, color: c.text }}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: Spacing.three, paddingHorizontal: Spacing.three, borderBottomWidth: 1, borderBottomColor: c.border }}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={{ paddingVertical: Spacing.two, borderBottomWidth: 2, borderBottomColor: tab === t.id ? c.brand : 'transparent' }}>
            <Text style={{ color: tab === t.id ? c.brand : c.textSecondary, fontWeight: '600' }}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {!ready ? (
        <EmptyView title="Search FoodZone" hint="Type at least 2 characters." />
      ) : tab === 'all' ? (
        <AllResults q={q} onSeeAll={setTab} />
      ) : tab === 'users' ? (
        <UsersResults q={q} />
      ) : tab === 'vendors' ? (
        <VendorsResults q={q} />
      ) : (
        <PostsResults q={q} />
      )}
    </SafeAreaView>
  );
}

function Spinner() {
  const c = useTheme();
  return (
    <View style={{ padding: Spacing.four, alignItems: 'center' }}>
      <ActivityIndicator color={c.brand} />
    </View>
  );
}

function UserRow({ user }: { user: User }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/user/${user.username}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}
    >
      <Avatar uri={user.profile?.avatar} name={user.name} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{user.name}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>@{user.username}</Text>
      </View>
    </Pressable>
  );
}

function VendorRow({ vendor }: { vendor: Vendor }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/vendor/${vendor.slug}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: Spacing.three }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: c.backgroundElement, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="storefront" size={18} color={c.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{vendor.name}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {vendor.rating_avg > 0 ? `★ ${vendor.rating_avg.toFixed(1)}` : 'New'}{vendor.city ? ` · ${vendor.city}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}

function AllResults({ q, onSeeAll }: { q: string; onSeeAll: (t: Tab) => void }) {
  const c = useTheme();
  const { data, isLoading } = useCombinedSearch(q);
  if (isLoading) return <Spinner />;
  if (!data) return null;
  const empty = data.users.length === 0 && data.vendors.length === 0 && data.posts.length === 0;
  if (empty) return <EmptyView title="No results" hint={`Nothing matched "${q}".`} />;

  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.three }}>
      {data.users.length > 0 && (
        <Section c={c} title="People" onSeeAll={() => onSeeAll('users')}>
          {data.users.map((u) => <UserRow key={u.id} user={u} />)}
        </Section>
      )}
      {data.vendors.length > 0 && (
        <Section c={c} title="Restaurants" onSeeAll={() => onSeeAll('vendors')}>
          {data.vendors.map((v) => <VendorRow key={v.id} vendor={v} />)}
        </Section>
      )}
      {data.posts.length > 0 && (
        <Section c={c} title="Posts" onSeeAll={() => onSeeAll('posts')}>
          {data.posts.map((p) => <PostCard key={p.id} post={p} />)}
        </Section>
      )}
    </ScrollView>
  );
}

function Section({ c, title, onSeeAll, children }: { c: ReturnType<typeof useTheme>; title: string; onSeeAll: () => void; children: React.ReactNode }) {
  return (
    <View style={{ gap: Spacing.two }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: 13 }}>{title}</Text>
        <Pressable onPress={onSeeAll}><Text style={{ color: c.brand, fontSize: 12 }}>See all</Text></Pressable>
      </View>
      {children}
    </View>
  );
}

function UsersResults({ q }: { q: string }) {
  const query = useTypedSearch(q, 'users');
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as User[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyView title="No people found" />;
  return (
    <FlashList<User>
      data={items}
      keyExtractor={(u) => String(u.id)}
      contentContainerStyle={{ padding: Spacing.three }}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View style={{ marginBottom: Spacing.two }}>
          <UserRow user={item} />
        </View>
      )}
    />
  );
}

function VendorsResults({ q }: { q: string }) {
  const query = useTypedSearch(q, 'vendors');
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as Vendor[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyView title="No restaurants found" />;
  return (
    <FlashList<Vendor>
      data={items}
      keyExtractor={(v) => String(v.id)}
      contentContainerStyle={{ padding: Spacing.three }}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View style={{ marginBottom: Spacing.two }}>
          <VendorRow vendor={item} />
        </View>
      )}
    />
  );
}

function PostsResults({ q }: { q: string }) {
  const query = useTypedSearch(q, 'posts');
  const items = (query.data?.pages.flatMap((p) => p.data) ?? []) as Post[];
  if (query.isLoading) return <Spinner />;
  if (items.length === 0) return <EmptyView title="No posts found" />;
  return (
    <FlashList<Post>
      data={items}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={{ padding: Spacing.three }}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.5}
      renderItem={({ item }) => (
        <View style={{ marginBottom: Spacing.three }}>
          <PostCard post={item} />
        </View>
      )}
    />
  );
}
