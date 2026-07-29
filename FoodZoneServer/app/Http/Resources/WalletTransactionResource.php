<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WalletTransactionResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'balance_after' => (float) $this->balance_after,
            'type' => $this->type,
            'note' => $this->note,
            'created_at' => $this->created_at,
        ];
    }
}
