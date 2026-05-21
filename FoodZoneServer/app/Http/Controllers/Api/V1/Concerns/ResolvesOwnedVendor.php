<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use App\Models\Vendor;
use Illuminate\Http\Request;

trait ResolvesOwnedVendor
{
    /** The vendor owned by the current user, or abort 403. */
    protected function ownedVendor(Request $request): Vendor
    {
        $vendor = $request->user()->vendor;

        if (! $vendor) {
            abort(403, 'You do not have a vendor account.');
        }

        return $vendor;
    }
}
