<?php

namespace App\Http\Resources;

use App\Models\Post;
use App\Models\PostComment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Violation */
class ViolationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $subjectKind = match ($this->subject_type) {
            Post::class => 'post',
            PostComment::class => 'comment',
            null, '' => 'user',
            default => class_basename($this->subject_type),
        };

        // Best-effort body snippet for content reports.
        $subjectSnippet = null;
        if ($this->subject_type && $this->subject_id) {
            $model = $this->subject_type === Post::class
                ? Post::find($this->subject_id)
                : ($this->subject_type === PostComment::class ? PostComment::find($this->subject_id) : null);
            $subjectSnippet = $model?->body ?? null;
        }

        return [
            'id' => $this->id,
            'type' => $this->type,
            'severity' => $this->severity,
            'evidence' => $this->evidence,
            'status' => $this->status,
            'subject_kind' => $subjectKind,                  // post | comment | user
            'subject_id' => $this->subject_id,
            'subject_snippet' => $subjectSnippet,
            'user' => $this->whenLoaded('user', fn () => [   // the offender
                'id' => $this->user->id,
                'name' => $this->user->name,
                'username' => $this->user->username,
            ]),
            'reporter' => $this->whenLoaded('reporter', fn () => $this->reporter ? [
                'id' => $this->reporter->id,
                'name' => $this->reporter->name,
                'username' => $this->reporter->username,
            ] : null),
            'actions' => $this->whenLoaded('actions', fn () => $this->actions->map(fn ($a) => [
                'action_type' => $a->action_type,
                'notes' => $a->notes,
                'at' => $a->created_at?->toIso8601String(),
            ])),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
