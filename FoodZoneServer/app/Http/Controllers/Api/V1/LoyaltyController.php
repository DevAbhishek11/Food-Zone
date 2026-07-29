<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Controllers\Controller;
use App\Models\Badge;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderRating;
use App\Models\UserBadge;
use App\Services\LoyaltyService;
use App\Services\WalletService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoyaltyController extends Controller
{
    public function __construct(
        private LoyaltyService $loyalty,
        private WalletService $wallet,
    ) {}

    /**
     * Convert points into wallet credit at the configured rate (spec §13.4).
     * Points come off `points` (spendable balance) — `lifetime_points` stays
     * monotonic so tier progress is never reduced by redeeming.
     */
    public function redeem(Request $request): JsonResponse
    {
        $me = $request->user();
        $min = (int) config('loyalty.min_redeem_points', 100);

        $data = $request->validate([
            'points' => ['required', 'integer', "min:{$min}"],
        ]);

        $balance = $this->loyalty->balanceFor($me->id);
        if ($data['points'] > $balance->points) {
            throw ApiException::make('You don\'t have enough points for that.', 422);
        }

        $credit = round($data['points'] * (float) config('loyalty.redeem_rate_per_point', 0.1), 2);

        DB::transaction(function () use ($me, $balance, $data, $credit) {
            $balance->decrement('points', $data['points']);
            $txn = LoyaltyTransaction::create([
                'user_id' => $me->id,
                'amount' => -$data['points'],
                'reason' => 'redeemed',
            ]);
            $this->wallet->credit($me, $credit, 'loyalty_redemption', $txn, "Redeemed {$data['points']} points");
        });

        return ApiResponse::success([
            'points_redeemed' => $data['points'],
            'wallet_credit' => $credit,
            'remaining_points' => $balance->fresh()->points,
        ], 'Points redeemed.');
    }

    /** Caller's loyalty snapshot: points, tier, unlocked + locked badges. */
    public function me(Request $request): JsonResponse
    {
        $me = $request->user();
        $this->loyalty->checkBadges($me);
        $balance = $this->loyalty->balanceFor($me->id);

        $earned = UserBadge::where('user_id', $me->id)
            ->with('badge')
            ->get()
            ->keyBy('badge_id');

        $catalog = Badge::orderBy('threshold')->get()->map(fn (Badge $b) => [
            'key' => $b->key,
            'name' => $b->name,
            'description' => $b->description,
            'icon' => $b->icon,
            'unlocked' => $earned->has($b->id),
            'awarded_at' => $earned->get($b->id)?->awarded_at?->toIso8601String(),
        ]);

        $recent = LoyaltyTransaction::where('user_id', $me->id)
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn (LoyaltyTransaction $t) => [
                'id' => $t->id,
                'amount' => $t->amount,
                'reason' => $t->reason,
                'order_id' => $t->order_id,
                'created_at' => $t->created_at?->toIso8601String(),
            ]);

        return ApiResponse::success([
            'points' => $balance->points,
            'lifetime_points' => $balance->lifetime_points,
            'tier' => $balance->tier,
            'next_tier' => $this->nextTier($balance->lifetime_points),
            'badges' => $catalog,
            'recent_transactions' => $recent,
        ], 'Loyalty snapshot.');
    }

    /** Top-50 users ranked by a chosen metric. */
    public function leaderboard(Request $request): JsonResponse
    {
        $type = $request->query('type', 'points');
        $type = in_array($type, ['points', 'orders', 'reviews'], true) ? $type : 'points';

        $rows = match ($type) {
            'points' => \DB::table('user_loyalty')
                ->join('users', 'users.id', '=', 'user_loyalty.user_id')
                ->select('users.id', 'users.name', 'users.username', 'user_loyalty.lifetime_points as score')
                ->orderByDesc('user_loyalty.lifetime_points')
                ->limit(50)
                ->get(),
            'orders' => Order::query()
                ->where('orders.status', 'delivered')
                ->join('users', 'users.id', '=', 'orders.user_id')
                ->select('users.id', 'users.name', 'users.username', \DB::raw('COUNT(orders.id) as score'))
                ->groupBy('users.id', 'users.name', 'users.username')
                ->orderByDesc('score')
                ->limit(50)
                ->get(),
            'reviews' => OrderRating::query()
                ->join('users', 'users.id', '=', 'order_ratings.user_id')
                ->select('users.id', 'users.name', 'users.username', \DB::raw('COUNT(order_ratings.id) as score'))
                ->groupBy('users.id', 'users.name', 'users.username')
                ->orderByDesc('score')
                ->limit(50)
                ->get(),
        };

        return ApiResponse::success([
            'type' => $type,
            'entries' => $rows->map(fn ($r, $i) => [
                'rank' => $i + 1,
                'user' => ['id' => $r->id, 'name' => $r->name, 'username' => $r->username],
                'score' => (int) $r->score,
            ])->values(),
        ], 'Leaderboard.');
    }

    private function nextTier(int $lifetime): ?array
    {
        $tiers = \App\Models\UserLoyalty::TIERS;
        foreach ($tiers as $name => $floor) {
            if ($lifetime < $floor) {
                return ['name' => $name, 'points_to_go' => $floor - $lifetime];
            }
        }
        return null; // Already at platinum.
    }
}
