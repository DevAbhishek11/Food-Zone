<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'username',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'dob',
        'gender',
        'referral_code',
        'referred_by',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'email_verification_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_active_at' => 'datetime',
            'suspended_until' => 'datetime',
            'deactivated_at' => 'datetime',
            'dob' => 'date',
            'password' => 'hashed',
            'role' => UserRole::class,
            'status' => UserStatus::class,
        ];
    }

    // ----------------------------------------------------------------
    // Relationships
    // ----------------------------------------------------------------

    public function profile(): HasOne
    {
        return $this->hasOne(UserProfile::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(UserAddress::class);
    }

    public function vendor(): HasOne
    {
        return $this->hasOne(Vendor::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function violations(): HasMany
    {
        return $this->hasMany(Violation::class);
    }

    /** Users this user is following. */
    public function following(): HasMany
    {
        return $this->hasMany(Follow::class, 'follower_id');
    }

    /** Users following this user. */
    public function followers(): HasMany
    {
        return $this->hasMany(Follow::class, 'following_id');
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(Block::class, 'blocker_id');
    }

    // ----------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------

    public function isAdmin(): bool
    {
        return $this->role instanceof UserRole && $this->role->isAdmin();
    }

    public function hasRole(UserRole|string $role): bool
    {
        $value = $role instanceof UserRole ? $role->value : $role;

        return $this->role?->value === $value;
    }

    public function isActive(): bool
    {
        return $this->status === UserStatus::Active;
    }

    public function isFollowing(int $userId): bool
    {
        return $this->following()
            ->where('following_id', $userId)
            ->where('status', 'accepted')
            ->exists();
    }

    public function hasBlocked(int $userId): bool
    {
        return $this->blocks()->where('blocked_id', $userId)->exists();
    }

    /** IDs blocked by this user OR who blocked this user (used to filter feeds). */
    public function blockedUserIds(): array
    {
        $blocked = Block::query()
            ->where('blocker_id', $this->id)
            ->orWhere('blocked_id', $this->id)
            ->get(['blocker_id', 'blocked_id']);

        return $blocked
            ->flatMap(fn (Block $b) => [$b->blocker_id, $b->blocked_id])
            ->reject(fn ($id) => $id === $this->id)
            ->unique()
            ->values()
            ->all();
    }
}
