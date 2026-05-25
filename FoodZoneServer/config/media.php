<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Media storage disk
    |--------------------------------------------------------------------------
    |
    | Disk used by the media upload endpoint. Defaults to the local "public"
    | disk (served via `php artisan storage:link`). In production set
    | MEDIA_DISK=s3 (or a Cloudinary-backed disk) and configure the disk's
    | `url` to your CDN domain — uploaded URLs are returned absolute.
    |
    */

    'disk' => env('MEDIA_DISK', 'public'),

    // Max upload size in kilobytes.
    'max_kb' => (int) env('MEDIA_MAX_KB', 5120),

    // Allowed image extensions.
    'mimes' => ['jpeg', 'jpg', 'png', 'webp', 'gif'],
];
