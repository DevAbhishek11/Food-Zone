<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role?->value,
            'status' => $this->status?->value,
            'gender' => $this->gender,
            'dob' => $this->dob?->toDateString(),
            'email_verified' => $this->email_verified_at !== null,
            'referral_code' => $this->referral_code,
            'profile' => new UserProfileResource($this->whenLoaded('profile')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
