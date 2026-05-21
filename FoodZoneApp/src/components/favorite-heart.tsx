import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { useToggleFavorite } from '@/lib/hooks';

export function FavoriteHeart({ vendorId, initial, size = 24 }: { vendorId: number; initial?: boolean; size?: number }) {
  const c = useTheme();
  const [fav, setFav] = useState(!!initial);
  const { favorite, unfavorite } = useToggleFavorite();
  const busy = favorite.isPending || unfavorite.isPending;

  const toggle = () => {
    if (busy) return;
    const next = !fav;
    setFav(next);
    const m = next ? favorite : unfavorite;
    m.mutate(vendorId, { onError: () => setFav(!next) });
  };

  return (
    <Pressable onPress={toggle} hitSlop={10}>
      <Ionicons name={fav ? 'heart' : 'heart-outline'} size={size} color={fav ? c.brand : c.textSecondary} />
    </Pressable>
  );
}
