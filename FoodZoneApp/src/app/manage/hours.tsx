import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorView, Loading } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useUpdateHours, useVendorHours } from '@/lib/hooks';
import type { OperatingHour } from '@/lib/types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function defaultWeek(existing: OperatingHour[]): OperatingHour[] {
  const byDay = new Map(existing.map((h) => [h.day_of_week, h]));
  return DAYS.map((_, day) => {
    const h = byDay.get(day);
    return {
      day_of_week: day,
      is_closed: h ? h.is_closed : day === 0,
      open_time: h?.open_time ? h.open_time.slice(0, 5) : '09:00',
      close_time: h?.close_time ? h.close_time.slice(0, 5) : '22:00',
    };
  });
}

export default function ManageHoursScreen() {
  const c = useTheme();
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useVendorHours();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={c.text} />
        </Pressable>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Operating Hours</Text>
      </View>

      {isLoading ? (
        <Loading />
      ) : isError || !data ? (
        <ErrorView message="Couldn't load hours." onRetry={refetch} />
      ) : (
        <HoursEditor initial={data} />
      )}
    </SafeAreaView>
  );
}

function HoursEditor({ initial }: { initial: OperatingHour[] }) {
  const c = useTheme();
  const [week, setWeek] = useState<OperatingHour[]>(() => defaultWeek(initial));
  const update = useUpdateHours();

  const setDay = (day: number, patch: Partial<OperatingHour>) =>
    setWeek((w) => w.map((h) => (h.day_of_week === day ? { ...h, ...patch } : h)));

  const save = () =>
    update.mutate(week, {
      onSuccess: () => Alert.alert('Saved', 'Operating hours updated.'),
      onError: () => Alert.alert('Error', 'Could not save hours.'),
    });

  return (
    <ScrollView contentContainerStyle={{ padding: Spacing.three, gap: Spacing.two }}>
      {week.map((h) => (
        <View key={h.day_of_week} style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, padding: Spacing.three, gap: Spacing.two }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text, fontWeight: '600' }}>{DAYS[h.day_of_week]}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <Text style={{ color: c.textSecondary, fontSize: 13 }}>{h.is_closed ? 'Closed' : 'Open'}</Text>
              <Switch value={!h.is_closed} onValueChange={(v) => setDay(h.day_of_week, { is_closed: !v })} trackColor={{ true: c.brand }} />
            </View>
          </View>
          {!h.is_closed && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
              <TextInput
                value={h.open_time ?? '09:00'}
                onChangeText={(v) => setDay(h.day_of_week, { open_time: v })}
                placeholder="09:00"
                placeholderTextColor={c.textSecondary}
                style={{ flex: 1, height: 40, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: Spacing.two, color: c.text, textAlign: 'center' }}
              />
              <Text style={{ color: c.textSecondary }}>to</Text>
              <TextInput
                value={h.close_time ?? '22:00'}
                onChangeText={(v) => setDay(h.day_of_week, { close_time: v })}
                placeholder="22:00"
                placeholderTextColor={c.textSecondary}
                style={{ flex: 1, height: 40, borderWidth: 1, borderColor: c.border, borderRadius: 8, paddingHorizontal: Spacing.two, color: c.text, textAlign: 'center' }}
              />
            </View>
          )}
        </View>
      ))}
      <Button title="Save hours" onPress={save} loading={update.isPending} fullWidth />
    </ScrollView>
  );
}
