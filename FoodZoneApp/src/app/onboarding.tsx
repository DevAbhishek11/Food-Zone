import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/lib/auth-store';
import { useCompleteOnboarding, useExplore, useSkipOnboarding } from '@/lib/hooks';

const CUISINES = ['Italian', 'Thai', 'Indian', 'Mexican', 'Japanese', 'Chinese', 'American', 'Mediterranean', 'Korean', 'Vietnamese', 'French', 'Lebanese'];
const DIETS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-free', 'Nut-free', 'Dairy-free', 'Low-carb'];

const STEP_TITLES = [
  { icon: 'restaurant-outline' as const, title: 'What do you love eating?', subtitle: 'Pick at least 3 cuisines — we tailor your feed from these.' },
  { icon: 'leaf-outline' as const, title: 'Any dietary restrictions?', subtitle: "We'll filter menus to match. Change anytime in settings." },
  { icon: 'location-outline' as const, title: 'Where are you?', subtitle: 'For nearby restaurants + accurate delivery times.' },
  { icon: 'people-outline' as const, title: 'Follow a few foodies', subtitle: 'Your feed gets better with every follow.' },
];

export default function OnboardingScreen() {
  const c = useTheme();
  const router = useRouter();
  const hydrate = useAuthStore((s) => s.hydrate);

  const [step, setStep] = useState(0);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [diets, setDiets] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [follows, setFollows] = useState<number[]>([]);

  const explore = useExplore(null);
  const complete = useCompleteOnboarding();
  const skip = useSkipOnboarding();

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location off', 'Enable location to auto-fill, or type your city.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
    } catch {
      Alert.alert('Could not detect location.');
    }
  };

  const toggle = <T,>(arr: T[], setArr: (a: T[]) => void, value: T) =>
    setArr(arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]);

  const finish = async () => {
    try {
      await complete.mutateAsync({
        food_preferences: cuisines.map((s) => s.toLowerCase()),
        dietary_restrictions: diets.map((s) => s.toLowerCase()),
        location: location || undefined,
        follow_user_ids: follows,
      });
      await hydrate();
      router.replace('/');
    } catch {
      Alert.alert("Couldn't save", 'Please try again.');
    }
  };

  const skipAll = async () => {
    try {
      await skip.mutateAsync();
      await hydrate();
      router.replace('/');
    } catch {
      Alert.alert("Couldn't skip", 'Please try again.');
    }
  };

  const current = STEP_TITLES[step];
  const canContinue = step !== 0 || cuisines.length >= 3;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.background }}>
      {/* Progress dots */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: Spacing.three, paddingBottom: Spacing.two }}>
        {STEP_TITLES.map((_, i) => (
          <View
            key={i}
            style={{
              height: 6,
              width: i === step ? 28 : 6,
              borderRadius: 999,
              backgroundColor: i <= step ? c.brand : c.border,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: Spacing.three, gap: Spacing.three, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: c.brand + '1f', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={current.icon} size={20} color={c.brand} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>{current.title}</Text>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>{current.subtitle}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.four, gap: Spacing.two }}>
          {step === 0 && <Chips options={CUISINES} selected={cuisines} onToggle={(v) => toggle(cuisines, setCuisines, v)} />}
          {step === 1 && <Chips options={DIETS} selected={diets} onToggle={(v) => toggle(diets, setDiets, v)} />}
          {step === 2 && (
            <View style={{ gap: Spacing.two }}>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="City or neighbourhood"
                placeholderTextColor={c.textSecondary}
                style={{
                  height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border,
                  backgroundColor: c.card, color: c.text, paddingHorizontal: Spacing.three,
                }}
              />
              <Button title="Use my current location" onPress={detectLocation} variant="secondary" />
            </View>
          )}
          {step === 3 && (
            <View style={{ gap: Spacing.two }}>
              {explore.isLoading && <Text style={{ color: c.textSecondary }}>Loading suggestions…</Text>}
              {explore.data?.suggested_users.length === 0 && (
                <Text style={{ color: c.textSecondary }}>No suggestions yet — follow people later from any profile.</Text>
              )}
              {explore.data?.suggested_users.map((s) => {
                const on = follows.includes(s.user.id);
                return (
                  <View
                    key={s.user.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
                      padding: Spacing.two, backgroundColor: c.card,
                      borderRadius: 12, borderWidth: 1, borderColor: c.border,
                    }}
                  >
                    <Avatar uri={s.user.avatar} name={s.user.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: c.text, fontWeight: '600' }} numberOfLines={1}>{s.user.name}</Text>
                      <Text style={{ color: c.textSecondary, fontSize: 12 }} numberOfLines={1}>@{s.user.username}</Text>
                    </View>
                    <Pressable
                      onPress={() => toggle(follows, setFollows, s.user.id)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
                        backgroundColor: on ? c.card : c.brand,
                        borderWidth: 1, borderColor: on ? c.border : c.brand,
                      }}
                    >
                      <Text style={{ color: on ? c.text : c.brandText, fontWeight: '600', fontSize: 13 }}>{on ? 'Following' : 'Follow'}</Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: Spacing.three, gap: Spacing.two }}>
          <Pressable onPress={skipAll} disabled={skip.isPending || complete.isPending} hitSlop={8}>
            <Text style={{ color: c.textSecondary, fontSize: 14 }}>Skip for now</Text>
          </Pressable>
          <View style={{ flexDirection: 'row', gap: Spacing.two }}>
            {step > 0 && <Button title="Back" variant="secondary" onPress={() => setStep((s) => s - 1)} />}
            {step < 3 ? (
              <Button title="Continue" onPress={() => setStep((s) => s + 1)} disabled={!canContinue} />
            ) : (
              <Button title="Get started" onPress={finish} loading={complete.isPending} />
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  const c = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two }}>
      {options.map((opt) => {
        const on = selected.includes(opt);
        return (
          <Pressable
            key={opt}
            onPress={() => onToggle(opt)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
              backgroundColor: on ? c.brand : c.card,
              borderWidth: 1, borderColor: on ? c.brand : c.border,
            }}
          >
            {on && <Ionicons name="checkmark" size={14} color={c.brandText} />}
            <Text style={{ color: on ? c.brandText : c.text, fontSize: 13, fontWeight: '600' }}>{opt}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
