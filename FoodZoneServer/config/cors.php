<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Extends Laravel's default (api/*, sanctum/csrf-cookie) with
    | broadcasting/auth — Echo's private/presence channel subscription
    | posts here from the web app's origin, and without it in this list
    | the preflight has no Access-Control-Allow-Origin header, so every
    | private channel auth silently fails and no realtime event is ever
    | delivered (chat, order status, notifications all go dark).
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'broadcasting/auth'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
