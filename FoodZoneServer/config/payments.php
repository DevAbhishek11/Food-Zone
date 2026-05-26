<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Active gateway
    |--------------------------------------------------------------------------
    | One of: mock | razorpay | stripe. The default `mock` driver simulates the
    | full flow locally (no external calls) so development and the test suite
    | work without credentials. Switch to razorpay/stripe in production.
    */
    'gateway' => env('PAYMENT_GATEWAY', 'mock'),

    'currency' => env('PAYMENT_CURRENCY', 'INR'),

    /*
    | Header the public webhook endpoint reads the signature from. Razorpay uses
    | `X-Razorpay-Signature`, Stripe uses `Stripe-Signature`; the mock/generic
    | driver uses `X-Signature`.
    */
    'signature_header' => env('PAYMENT_SIGNATURE_HEADER', 'X-Signature'),

    'webhook_secret' => env('PAYMENT_WEBHOOK_SECRET', 'mock_webhook_secret'),

    'mock' => [
        'key' => env('PAYMENT_MOCK_KEY', 'mock_pub_key'),
    ],

    'razorpay' => [
        'key' => env('RAZORPAY_KEY'),
        'secret' => env('RAZORPAY_SECRET'),
        'webhook_secret' => env('RAZORPAY_WEBHOOK_SECRET'),
    ],

    'stripe' => [
        'key' => env('STRIPE_KEY'),                 // publishable key (client)
        'secret' => env('STRIPE_SECRET'),           // secret key (server)
        'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    ],
];
