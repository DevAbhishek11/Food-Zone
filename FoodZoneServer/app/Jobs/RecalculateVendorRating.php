<?php

namespace App\Jobs;

use App\Models\Vendor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Recompute a vendor's denormalised rating aggregate from its order ratings.
 * Queued so the customer's "rate" request returns immediately under a real
 * queue (runs inline with the sync driver used in dev/tests).
 */
class RecalculateVendorRating implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $vendorId) {}

    public function handle(): void
    {
        $vendor = Vendor::find($this->vendorId);
        if (! $vendor) {
            return;
        }

        $agg = $vendor->ratings()->selectRaw('AVG(rating) avg, COUNT(*) cnt')->first();

        $vendor->update([
            'rating_avg' => round((float) $agg->avg, 2),
            'rating_count' => (int) $agg->cnt,
        ]);
    }
}
