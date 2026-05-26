<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Push notifications
    |--------------------------------------------------------------------------
    | Disabled by default so development/tests never call the Expo push service.
    | Set PUSH_ENABLED=true in production (Expo handles FCM/APNs delivery via the
    | credentials configured in your Expo project).
    */
    'enabled' => env('PUSH_ENABLED', false),

    'expo_endpoint' => env('EXPO_PUSH_ENDPOINT', 'https://exp.host/--/api/v2/push/send'),

    // Optional Expo access token for enhanced rate limits / security.
    'expo_access_token' => env('EXPO_ACCESS_TOKEN'),
];
