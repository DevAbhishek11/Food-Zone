"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { ApiError } from "@/lib/api";
import { useCreateStory, useStories, useViewStory } from "@/lib/hooks/use-stories";
import { toast } from "@/lib/toast-store";
import type { StoryGroup } from "@/lib/types";
import { Plus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function StoryBar() {
  const { data: groups } = useStories();
  const [composing, setComposing] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null); // index into groups

  const list = groups ?? [];

  return (
    <div className="rounded-card border border-line bg-bg-soft p-3">
      <div className="flex gap-4 overflow-x-auto pb-1">
        <button onClick={() => setComposing(true)} className="flex w-16 shrink-0 flex-col items-center gap-1">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-line text-muted">
            <Plus className="h-5 w-5" />
          </span>
          <span className="truncate text-xs text-muted">Your story</span>
        </button>

        {list.map((g, i) => (
          <button key={g.user.id} onClick={() => setViewing(i)} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <Avatar src={g.user.avatar} name={g.user.name} size={56} ring={g.has_unseen} />
            <span className="w-16 truncate text-center text-xs text-muted">{g.is_mine ? "You" : g.user.username}</span>
          </button>
        ))}
      </div>

      {composing && <StoryComposer onClose={() => setComposing(false)} />}
      {viewing !== null && list[viewing] && (
        <StoryViewer
          groups={list}
          startIndex={viewing}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}

function StoryComposer({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const create = useCreateStory();

  const submit = async () => {
    if (!url) return;
    try {
      await create.mutateAsync({ media_url: url, caption: caption.trim() || undefined });
      toast.success("Story shared!");
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Could not post story.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-line bg-bg-soft p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add to your story</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-content">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ImageUpload value={url} onChange={setUrl} category="story" label="Pick a photo" />
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          maxLength={255}
          className="mt-4 h-10 w-full rounded-lg border border-line bg-bg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/60"
        />
        <Button className="mt-4 w-full" onClick={submit} loading={create.isPending} disabled={!url}>
          Share to story
        </Button>
      </div>
    </div>
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
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  };

  const back = () => {
    if (storyIdx > 0) setStoryIdx((i) => i - 1);
    else if (groupIdx > 0) {
      const prev = groups[groupIdx - 1];
      setGroupIdx((g) => g - 1);
      setStoryIdx(Math.max(0, prev.stories.length - 1));
    }
  };

  // Record a view once per story, and auto-advance on a timer.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative flex h-full max-h-[80vh] w-full max-w-md flex-col" onClick={(e) => e.stopPropagation()}>
        {/* progress bars */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-3">
          {group.stories.map((s, i) => (
            <span key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <span className={i < storyIdx ? "block h-full w-full bg-white" : i === storyIdx ? "block h-full w-full bg-white" : "block h-full w-0"} />
            </span>
          ))}
        </div>

        <div className="absolute inset-x-0 top-0 z-20 mt-5 flex items-center gap-2 p-3">
          <Avatar src={group.user.avatar} name={group.user.name} size={32} />
          <span className="text-sm font-medium text-white">{group.user.username}</span>
          <button onClick={onClose} aria-label="Close" className="ml-auto text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={story.media_url} alt="" className="h-full w-full rounded-lg object-contain" />

        {story.caption && (
          <p className="absolute inset-x-0 bottom-8 px-6 text-center text-white drop-shadow">{story.caption}</p>
        )}

        {/* tap zones */}
        <button aria-label="Previous" onClick={back} className="absolute inset-y-0 left-0 w-1/3" />
        <button aria-label="Next" onClick={advance} className="absolute inset-y-0 right-0 w-1/3" />
      </div>
    </div>
  );
}
