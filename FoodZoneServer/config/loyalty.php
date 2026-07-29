<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Points redemption rate
    |--------------------------------------------------------------------------
    |
    | Rupees credited to the wallet per point redeemed (spec §13.4: "Redeem:
    | ₹1 per X points"). Mirrors the earn rate (1 point per ₹10 spent) so a
    | full earn→redeem round trip is symmetric.
    |
    */

    'redeem_rate_per_point' => (float) env('LOYALTY_REDEEM_RATE', 0.1),

    // Minimum points a user must redeem in one request.
    'min_redeem_points' => (int) env('LOYALTY_MIN_REDEEM_POINTS', 100),
];
