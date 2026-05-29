import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExplore, type ExplorePayload } from '@/lib/hooks';
import type { Post, Vendor } from '@/lib/types';

type Segment = 'all' | 'restaurants' | 'people' | 'hashtags';
const SEGMENTS: { value: Segment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'people', label: 'People' },
  { value: 'hashtags', label: 'Hashtags' },
];

export default function ExploreScreen() {
  const c = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request location once.
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } catch {
        /* permission denied or unavailable — keep nearby empty */
      }
    })();
  }, []);

  const { data, isLoading, isError, refetch } = useExplore(coords);

  const submitSearch = () => {
    const q = search.trim();
    if (q) router.push(`/?q=${encodeURIComponent(q)}`);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: Spacing.two, borderBottomWidth: 1, borderBottomColor: c.border }}>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '700' }}>Explore</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, paddingHorizontal: Spacing.two }}>
          <Ionicons name="search" size={18} color={c.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={submitSearch}
            placeholder="Search restaurants, people, posts…"
            placeholderTextColor={c.textSecondary}
            style={{ flex: 1, height: 40, color: c.text }}
            autoCapitalize="none"
            returnKeyType="search"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {SEGMENTS.map((s) => {
            const active = segment === s.value;
            return (
              <Pressable
                key={s.value}
                onPress={() => setSegment(s.value)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: active ? c.brand : c.card,
                  borderWidth: 1,
                  borderColor: active ? c.brand : c.border,
                }}
              >
                <Text style={{ color: active ? c.brandText : c.text, fontSize: 13, fontWeight: '600' }}>{s.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorView message="Could not load explore." onRetry={refetch} />
      ) : data ? (
        <ExploreContent data={data} segment={segment} hasLocation={!!coords} />
      ) : null}
    </SafeAreaView>
  );
}

function ExploreContent({
  data,
  segment,
  hasLocation,
}: {
  data: ExplorePayload;
  segment: Segment;
  hasLocation: boolean;
}) {
  const showFood = segment === 'all';
  const showVendors = segment === 'all' || segment === 'restaurants';
  const showPeople = segment === 'all' || segment === 'people';
  const showHashtags = segment === 'all' || segment === 'hashtags';

  const totalSections =
    (showFood && data.trending_posts.length ? 1 : 0) +
    (showVendors && data.trending_vendors.length ? 1 : 0) +
    (showHashtags && data.trending_hashtags.length ? 1 : 0) +
    (showPeople && data.suggested_users.length ? 1 : 0) +
    (showVendors && hasLocation && data.nearby_vendors.length ? 1 : 0);

  if (totalSections === 0) {
    return <EmptyView title="Nothing trending yet" hint="Check back soon." />;
  }

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: Spacing.four }}>
      {showFood && data.trending_posts.length > 0 && <TrendingPostsMasonry posts={data.trending_posts} />}
      {showVendors && data.trending_vendors.length > 0 && (
        <VendorRow title="🔥 Hot today" rows={data.trending_vendors.map((r) => ({ vendor: r.vendor, badge: `${r.order_delta >= 0 ? '+' : ''}${r.order_delta}%` }))} />
      )}
      {showHashtags && data.trending_hashtags.length > 0 && <HashtagChips rows={data.trending_hashtags} />}
      {showPeople && data.suggested_users.length > 0 && <PeopleRow rows={data.suggested_users} />}
      {showVendors && hasLocation && data.nearby_vendors.length > 0 && (
        <VendorRow title="📍 Near you" rows={data.nearby_vendors.map((v) => ({ vendor: v, badge: `${v.distance_km.toFixed(1)} km` }))} />
      )}
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  const c = useTheme();
  return (
    <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', paddingHorizontal: Spacing.three, marginTop: Spacing.three, marginBottom: Spacing.two }}>
      {children}
    </Text>
  );
}

function TrendingPostsMasonry({ posts }: { posts: Post[] }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View style={{ marginBottom: Spacing.three }}>
      <SectionTitle>📈 Trending now</SectionTitle>
      <View style={{ height: 540, paddingHorizontal: Spacing.two }}>
        <FlashList<Post>
          data={posts}
          numColumns={2}
          masonry
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item, index }) => {
            // Alternate heights for visual interest.
            const height = index % 3 === 0 ? 220 : index % 3 === 1 ? 160 : 190;
            return (
              <Pressable
                onPress={() => router.push(`/post/${item.id}`)}
                style={{ flex: 1, margin: 4, borderRadius: 12, overflow: 'hidden', backgroundColor: c.card, borderWidth: 1, borderColor: c.border }}
              >
                <View style={{ height, backgroundColor: c.backgroundElement }}>
                  {item.media[0] ? (
                    <Image source={{ uri: item.media[0].url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <Text style={{ padding: 10, color: c.textSecondary, fontSize: 12 }} numberOfLines={6}>
                      {item.body ?? '—'}
                    </Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
                  <Ionicons name="heart" size={12} color={c.danger} />
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>{item.likes_count}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>·</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }} numberOfLines={1}>@{item.author.username}</Text>
                </View>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

function VendorRow({ title, rows }: { title: string; rows: { vendor: Vendor; badge: string }[] }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View style={{ marginBottom: Spacing.three }}>
      <SectionTitle>{title}</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
        {rows.map((r, i) => (
          <Pressable
            key={`${r.vendor.id}-${i}`}
            onPress={() => router.push(`/vendor/${r.vendor.slug}`)}
            style={{ width: 200, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden' }}
          >
            <View style={{ height: 100, backgroundColor: c.backgroundElement }}>
              {r.vendor.banner ? (
                <Image source={{ uri: r.vendor.banner }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.border, fontSize: 28, fontWeight: '800' }}>{r.vendor.name.charAt(0)}</Text>
                </View>
              )}
              <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: c.background, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
                <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>{r.badge}</Text>
              </View>
            </View>
            <View style={{ padding: 10 }}>
              <Text style={{ color: c.text, fontWeight: '600' }} numberOfLines={1}>{r.vendor.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="star" size={12} color={c.warning} />
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                  {r.vendor.rating_avg > 0 ? r.vendor.rating_avg.toFixed(1) : 'New'}
                </Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }}>·</Text>
                <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>{r.vendor.city ?? '—'}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function HashtagChips({ rows }: { rows: { tag: string; count: number }[] }) {
  const c = useTheme();
  const router = useRouter();
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <View style={{ marginBottom: Spacing.three }}>
      <SectionTitle>#️⃣ Trending hashtags</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Spacing.three }}>
        {rows.map((r) => {
          const size = 13 + Math.round((r.count / max) * 7);
          return (
            <Pressable
              key={r.tag}
              onPress={() => router.push(`/hashtag/${r.tag}`)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.card, borderWidth: 1, borderColor: c.border }}
            >
              <Text style={{ color: c.brand, fontSize: size, fontWeight: '600' }}>#{r.tag} <Text style={{ color: c.textSecondary, fontSize: 11 }}>·{r.count}</Text></Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PeopleRow({ rows }: { rows: ExplorePayload['suggested_users'] }) {
  const c = useTheme();
  const router = useRouter();
  return (
    <View style={{ marginBottom: Spacing.three }}>
      <SectionTitle>👥 People you may know</SectionTitle>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.two }}>
        {rows.map((r) => (
          <Pressable
            key={r.user.id}
            onPress={() => router.push(`/u/${r.user.username}`)}
            style={{ width: 140, alignItems: 'center', padding: Spacing.two, backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, gap: 6 }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.backgroundElement, overflow: 'hidden' }}>
              {r.user.avatar ? (
                <Image source={{ uri: r.user.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: c.textSecondary, fontWeight: '700' }}>{r.user.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{r.user.name}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 11 }} numberOfLines={1}>
              {r.reason === 'mutuals' && r.mutual_count > 0 ? `${r.mutual_count} mutual` : 'Popular'}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
