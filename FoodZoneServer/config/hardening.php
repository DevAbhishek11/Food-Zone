<?php

return [

    /*
    | Master switch for API rate limiting. Disabled in the test suite (see
    | phpunit.xml) so functional tests aren't throttled; enabled everywhere else.
    */
    'rate_limit' => env('HARDENING_RATE_LIMIT', true),

    // Requests/minute for the general authenticated API (keyed by user or IP).
    'api_per_minute' => (int) env('RATE_LIMIT_API', 120),

    // Requests/minute for unauthenticated auth endpoints (keyed by IP).
    'auth_per_minute' => (int) env('RATE_LIMIT_AUTH', 20),
];
