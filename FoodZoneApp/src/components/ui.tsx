import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger';

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  fullWidth,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
  fullWidth?: boolean;
}) {
  const c = useTheme();
  const bg = variant === 'primary' ? c.brand : variant === 'danger' ? c.danger : c.backgroundElement;
  const fg = variant === 'secondary' ? c.text : c.brandText;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1 },
        fullWidth && { alignSelf: 'stretch' },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={{ gap: Spacing.one }}>
      {label && <Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '500' }}>{label}</Text>}
      <TextInput
        placeholderTextColor={c.textSecondary}
        style={[
          styles.input,
          { backgroundColor: c.card, color: c.text, borderColor: error ? c.danger : c.border },
        ]}
        {...props}
      />
      {error && <Text style={{ color: c.danger, fontSize: 12 }}>{error}</Text>}
    </View>
  );
}

export function Avatar({ uri, name, size = 40 }: { uri?: string | null; name: string; size?: number }) {
  const c = useTheme();
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.backgroundElement,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} contentFit="cover" />
      ) : (
        <Text style={{ color: c.textSecondary, fontWeight: '700', fontSize: size * 0.35 }}>
          {initials || '?'}
        </Text>
      )}
    </View>
  );
}

export function Loading() {
  const c = useTheme();
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color={c.brand} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useTheme();
  return (
    <View style={styles.centered}>
      <Text style={{ color: c.textSecondary, textAlign: 'center', marginBottom: Spacing.three }}>{message}</Text>
      {onRetry && <Button title="Try again" variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function EmptyView({ title, hint }: { title: string; hint?: string }) {
  const c = useTheme();
  return (
    <View style={styles.centered}>
      <Text style={{ color: c.text, fontWeight: '600', fontSize: 16 }}>{title}</Text>
      {hint && <Text style={{ color: c.textSecondary, marginTop: 4, textAlign: 'center' }}>{hint}</Text>}
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={{ backgroundColor: color + '26', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '600', textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonText: { fontSize: 16, fontWeight: '600' },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.four, minHeight: 200 },
});
