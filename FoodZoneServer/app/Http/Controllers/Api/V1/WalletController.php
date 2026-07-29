<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\WalletTransactionResource;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WalletController extends Controller
{
    public function __construct(private WalletService $wallet) {}

    public function show(Request $request): JsonResponse
    {
        $wallet = $this->wallet->balanceFor($request->user());

        return ApiResponse::success(['balance' => $wallet->balance], 'Wallet loaded.');
    }

    public function transactions(Request $request): JsonResponse
    {
        $transactions = WalletTransaction::where('user_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return ApiResponse::paginated($transactions, WalletTransactionResource::class, 'Wallet transactions loaded.');
    }
}
