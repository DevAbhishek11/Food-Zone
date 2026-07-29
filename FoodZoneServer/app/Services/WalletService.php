<?php

namespace App\Services;

use App\Exceptions\ApiException;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Single entry-point for wallet (FoodZone Credits) balance changes. Every
 * change is logged to wallet_transactions with the resulting balance, so the
 * ledger is self-auditing — a user's balance is always independently
 * reconstructible by summing their transactions.
 */
class WalletService
{
    /** Lazily create the wallet row for a user. */
    public function balanceFor(User $user): Wallet
    {
        return Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
    }

    public function credit(User $user, float $amount, string $type, ?Model $reference = null, ?string $note = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw ApiException::make('Credit amount must be positive.', 422);
        }

        return DB::transaction(function () use ($user, $amount, $type, $reference, $note) {
            $wallet = $this->balanceFor($user);
            $wallet->increment('balance', $amount);

            return WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => $amount,
                'balance_after' => $wallet->fresh()->balance,
                'type' => $type,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'note' => $note,
            ]);
        });
    }

    /** @throws ApiException when the wallet doesn't have enough balance. */
    public function debit(User $user, float $amount, string $type, ?Model $reference = null, ?string $note = null): WalletTransaction
    {
        if ($amount <= 0) {
            throw ApiException::make('Debit amount must be positive.', 422);
        }

        return DB::transaction(function () use ($user, $amount, $type, $reference, $note) {
            // lockForUpdate: two simultaneous debits (e.g. two tabs placing an
            // order at once) must not both pass the balance check.
            $wallet = Wallet::lockForUpdate()->firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

            if ($wallet->balance < $amount) {
                throw ApiException::make('Insufficient wallet balance.', 422);
            }

            $wallet->decrement('balance', $amount);

            return WalletTransaction::create([
                'user_id' => $user->id,
                'amount' => -$amount,
                'balance_after' => $wallet->fresh()->balance,
                'type' => $type,
                'reference_type' => $reference?->getMorphClass(),
                'reference_id' => $reference?->getKey(),
                'note' => $note,
            ]);
        });
    }
}
