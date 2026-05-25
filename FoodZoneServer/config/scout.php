<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Search Engine
    |--------------------------------------------------------------------------
    |
    | Defaults to "null" (a no-op engine) so the app runs everywhere without an
    | external search server. The DB-backed `/search` endpoint is used as the
    | fallback. In production set SCOUT_DRIVER=meilisearch and run
    | `php artisan scout:import "App\Models\Vendor"` (etc.) to index records.
    |
    */

    'driver' => env('SCOUT_DRIVER', 'null'),

    'prefix' => env('SCOUT_PREFIX', 'foodzone_'),

    'queue' => env('SCOUT_QUEUE', false),

    'after_commit' => false,

    'chunk' => [
        'searchable' => 500,
        'unsearchable' => 500,
    ],

    'soft_delete' => false,

    'identify' => env('SCOUT_IDENTIFY', false),

    'meilisearch' => [
        'host' => env('MEILISEARCH_HOST', 'http://localhost:7700'),
        'key' => env('MEILISEARCH_KEY'),
        'index-settings' => [
            // Attributes Meilisearch may filter on (needed for ->where()/->whereNotIn()).
            \App\Models\Vendor::class => [
                'filterableAttributes' => ['status', 'city'],
                'sortableAttributes' => ['rating_avg'],
            ],
            \App\Models\Post::class => [
                'filterableAttributes' => ['privacy', 'user_id'],
            ],
            \App\Models\User::class => [
                'filterableAttributes' => ['status'],
            ],
        ],
    ],
];
