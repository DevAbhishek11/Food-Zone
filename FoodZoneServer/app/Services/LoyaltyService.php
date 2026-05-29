<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\User;
use App\Models\UserBadge;
use App\Models\UserLoyalty;
use Illuminate\Support\Facades\DB;

/**
 * Single entry-point for loyalty-points and badge bookkeeping.
 * Idempotent at the per-order grain (an order earns points exactly once).
 */
class LoyaltyService
{
    /**
     * Award points for a delivered order. Safe to call multiple times — the
     * (user_id, reason='order', order_id) row is the dedup key.
     */
    public function awardForDelivery(Order $order): void
    {
        if ($order->status->value !== 'delivered') return;

        DB::transaction(function () use ($order) {
            $alreadyAwarded = LoyaltyTransaction::where('user_id', $order->user_id)
                ->where('reason', 'order')
                ->where('order_id', $order->id)
                ->exists();
            if ($alreadyAwarded) return;

            $points = (int) floor(((float) $order->total) / 10); // 1 pt per ₹10
            if ($points <= 0) return;

            $loyalty = $this->balanceFor($order->user_id);

            LoyaltyTransaction::create([
                'user_id' => $order->user_id,
                'amount' => $points,
                'reason' => 'order',
                'order_id' => $order->id,
            ]);

            // First-order bonus (50 pts) on the very first 'order' txn.
            $orderTxnCount = LoyaltyTransaction::where('user_id', $order->user_id)->where('reason', 'order')->count();
            $bonus = 0;
            if ($orderTxnCount === 1) {
                $bonus = 50;
                LoyaltyTransaction::create([
                    'user_id' => $order->user_id,
                    'amount' => $bonus,
                    'reason' => 'first_order_bonus',
                    'order_id' => $order->id,
                ]);
            }

            $loyalty->points += $points + $bonus;
            $loyalty->lifetime_points += $points + $bonus;
            $loyalty->tier = UserLoyalty::tierFor($loyalty->lifetime_points);
            $loyalty->save();

            $this->checkBadges(User::find($order->user_id));
        });
    }

    /** Lazily create the loyalty row for a user. */
    public function balanceFor(int $userId): UserLoyalty
    {
        return UserLoyalty::firstOrCreate(
            ['user_id' => $userId],
            ['points' => 0, 'lifetime_points' => 0, 'tier' => 'bronze'],
        );
    }

    /**
     * Recompute and award any newly-earned badges. Cheap to run on hot paths
     * because each candidate only fires one COUNT query.
     */
    public function checkBadges(User $user): void
    {
        $stats = [
            'orders_count' => $user->orders()->where('status', 'delivered')->count(),
            'followers_count' => $user->followers()->where('status', 'accepted')->count(),
            'distinct_vendors' => $user->orders()->where('status', 'delivered')->distinct('vendor_id')->count('vendor_id'),
        ];

        // Map badge key → which stat unlocks it.
        $rules = [
            'first_order' => ['orders_count', 1],
            'order_century' => ['orders_count', 100],
            'social_butterfly' => ['followers_count', 50],
            'food_explorer' => ['distinct_vendors', 20],
        ];

        $already = UserBadge::where('user_id', $user->id)->pluck('badge_id')->all();
        $candidates = Badge::whereIn('key', array_keys($rules))->get();

        foreach ($candidates as $badge) {
            if (in_array($badge->id, $already, true)) continue;
            [$statKey, $threshold] = $rules[$badge->key];
            if (($stats[$statKey] ?? 0) >= $threshold) {
                UserBadge::create([
                    'user_id' => $user->id,
                    'badge_id' => $badge->id,
                    'awarded_at' => now(),
                ]);
            }
        }
    }
}
