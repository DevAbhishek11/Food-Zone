<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Order acceptance window (minutes)
    |--------------------------------------------------------------------------
    |
    | How long a vendor has to accept a new order before the platform
    | auto-cancels it (spec §6.4). Enforced by the orders:cancel-stale
    | scheduled command; set to 0 to disable auto-cancellation.
    |
    */

    'acceptance_window_minutes' => (int) env('ORDER_ACCEPTANCE_WINDOW', 15),
];
