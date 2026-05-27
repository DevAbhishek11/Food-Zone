import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useCreateStory, useStories, useViewStory } from '@/lib/hooks';
import { useMediaUpload } from '@/lib/use-media';
import type { StoryGroup } from '@/lib/types';

export function StoryBar() {
  const c = useTheme();
  const { data: groups } = useStories();
  const { pickAndUpload, uploading } = useMediaUpload();
  const createStory = useCreateStory();
  const [viewing, setViewing] = useState<number | null>(null);

  const list = groups ?? [];

  const addStory = async () => {
    const url = await pickAndUpload('story');
    if (url) createStory.mutate({ media_url: url });
  };

  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: c.border, paddingVertical: Spacing.two }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: Spacing.three, gap: Spacing.three }}>
        <Pressable onPress={addStory} disabled={uploading} style={{ alignItems: 'center', width: 64, gap: 4 }}>
          <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', borderColor: c.border, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={uploading ? 'hourglass-outline' : 'add'} size={24} color={c.textSecondary} />
          </View>
          <Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 11 }}>Your story</Text>
        </Pressable>

        {list.map((g, i) => (
          <Pressable key={g.user.id} onPress={() => setViewing(i)} style={{ alignItems: 'center', width: 64, gap: 4 }}>
            <View style={{ padding: 2, borderRadius: 32, borderWidth: 2, borderColor: g.has_unseen ? c.brand : c.border }}>
              <Avatar uri={g.user.avatar} name={g.user.name} size={52} />
            </View>
            <Text numberOfLines={1} style={{ color: c.textSecondary, fontSize: 11, width: 60, textAlign: 'center' }}>
              {g.is_mine ? 'You' : g.user.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {viewing !== null && list[viewing] && (
        <StoryViewer groups={list} startIndex={viewing} onClose={() => setViewing(null)} />
      )}
    </View>
  );
}

const STORY_MS = 5000;

function StoryViewer({ groups, startIndex, onClose }: { groups: StoryGroup[]; startIndex: number; onClose: () => void }) {
  const [groupIdx, setGroupIdx] = useState(startIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const viewStory = useViewStory();
  const viewed = useRef<Set<number>>(new Set());

  const group = groups[groupIdx];
  const story = group?.stories[storyIdx];

  const advance = () => {
    if (!group) return;
    if (storyIdx < group.stories.length - 1) setStoryIdx((i) => i + 1);
    else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else onClose();
  };

  const back = () => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (groupIdx > 0) {
      setGroupIdx((g) => g - 1);
      setStoryIdx(0);
    }
  };

  useEffect(() => {
    if (!story) return;
    if (!viewed.current.has(story.id)) {
      viewed.current.add(story.id);
      viewStory.mutate(story.id);
    }
    const t = setTimeout(advance, STORY_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  if (!group || !story) return null;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: Spacing.three, paddingTop: 48 }}>
          {group.stories.map((s, i) => (
            <View key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= storyIdx ? '#fff' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.three }}>
          <Avatar uri={group.user.avatar} name={group.user.name} size={32} />
          <Text style={{ color: '#fff', fontWeight: '600' }}>{group.user.username}</Text>
          <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: 'auto' }}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <Image source={{ uri: story.media_url }} style={{ flex: 1 }} contentFit="contain" />
          {!!story.caption && (
            <Text style={{ position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', color: '#fff', paddingHorizontal: Spacing.four }}>
              {story.caption}
            </Text>
          )}
          <Pressable onPress={back} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '33%' }} />
          <Pressable onPress={advance} style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '33%' }} />
        </View>
      </View>
    </Modal>
  );
}
