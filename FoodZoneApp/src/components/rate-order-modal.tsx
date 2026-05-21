import { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { Stars } from '@/components/stars';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';
import { useRateOrder } from '@/lib/hooks';

export function RateOrderModal({
  orderId,
  vendorName,
  onClose,
}: {
  orderId: number;
  vendorName: string;
  onClose: () => void;
}) {
  const c = useTheme();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const rate = useRateOrder(orderId);

  const submit = async () => {
    if (rating < 1) {
      Alert.alert('Pick a rating', 'Please tap the stars to rate your order.');
      return;
    }
    if (review.trim() && review.trim().length < 20) {
      Alert.alert('Review too short', 'Reviews must be at least 20 characters, or leave it blank.');
      return;
    }
    try {
      await rate.mutateAsync({ rating, review: review.trim() || undefined });
      onClose();
    } catch (e) {
      Alert.alert('Could not submit', e instanceof ApiError ? e.message : 'Please try again.');
    }
  };

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: '#000000aa', alignItems: 'center', justifyContent: 'center', padding: Spacing.four }}>
        <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 380, backgroundColor: c.card, borderRadius: 16, padding: Spacing.four, gap: Spacing.three }}>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '700' }}>Rate {vendorName}</Text>

          <View style={{ alignItems: 'center', paddingVertical: Spacing.two }}>
            <Stars value={rating} size={36} onChange={setRating} />
          </View>

          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="Share details (optional, min 20 chars)…"
            placeholderTextColor={c.textSecondary}
            multiline
            style={{ minHeight: 80, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: Spacing.three, color: c.text, textAlignVertical: 'top' }}
          />

          <Button title="Submit review" onPress={submit} loading={rate.isPending} fullWidth />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
