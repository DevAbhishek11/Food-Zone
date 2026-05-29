import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, EmptyView } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

type LeaderboardType = 'points' | 'orders' | 'reviews';

interface Entry {
  rank: number;
  user: { id: number; name: string; username: string };
  score: number;
}

const TABS: { id: LeaderboardType; label: string }[] = [
  { id: 'points', label: 'Points' },
  { id: 'orders', label: 'Orders' },
  { id: 'reviews', label: 'Reviews' },
];

export default function LeaderboardScreen() {
  const c = useTheme();
  const router = useRouter();
  const [type, setType] = useState<LeaderboardType>('points');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', type],
    queryFn: () => api.get<{ type: string; entries: Entry[] }>(`/leaderboard?type=${type}`),
    select: (e) => e.data.entries,
    staleTime: 5 * 60 * 1000,
  });

  const rankIcon = (rank: number) => {
    if (rank === 1) return { name: 'trophy' as const, color: '#eab308' };
    if (rank === 2) return { name: 'medal' as const, color: '#a1a1aa' };
    if (rank === 3) return { name: 'medal' as const, color: '#b45309' };
    return null;
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Leaderboard</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.three, paddingBottom: Spacing.two }}>
        {TABS.map((t) => {
          const active = type === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                backgroundColor: active ? c.brand : c.card,
                borderWidth: 1, borderColor: active ? c.brand : c.border,
              }}
            >
              <Text style={{ color: active ? c.brandText : c.text, fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={{ padding: Spacing.four, alignItems: 'center' }}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : (data ?? []).length === 0 ? (
        <EmptyView title="No entries yet" hint="Fills up as people order and post." />
      ) : (
        <FlashList<Entry>
          data={data!}
          keyExtractor={(e) => String(e.user.id)}
          contentContainerStyle={{ padding: Spacing.three }}
          renderItem={({ item }) => {
            const icon = rankIcon(item.rank);
            return (
              <Pressable
                onPress={() => router.push(`/user/${item.user.username}`)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
                  padding: Spacing.three, marginBottom: 6, backgroundColor: c.card,
                  borderRadius: 12, borderWidth: 1, borderColor: c.border,
                }}
              >
                <View style={{ width: 32, alignItems: 'center' }}>
                  {icon ? (
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  ) : (
                    <Text style={{ color: c.textSecondary, fontWeight: '700' }}>#{item.rank}</Text>
                  )}
                </View>
                <Avatar name={item.user.name} size={36} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600' }} numberOfLines={1}>{item.user.name}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>@{item.user.username}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: c.text, fontWeight: '700' }}>{item.score.toLocaleString()}</Text>
                  <Text style={{ color: c.textSecondary, fontSize: 11 }}>
                    {type === 'points' ? 'pts' : type === 'orders' ? 'orders' : 'reviews'}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
