<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\Payments\MockPaymentGateway;
use App\Services\Payments\RazorpayPaymentGateway;
use App\Services\Payments\StripePaymentGateway;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Resolve the active payment gateway from config. Defaults to `mock`
        // so development and tests run without external credentials.
        $this->app->singleton(PaymentGateway::class, fn () => match (config('payments.gateway', 'mock')) {
            'razorpay' => new RazorpayPaymentGateway,
            'stripe' => new StripePaymentGateway,
            default => new MockPaymentGateway,
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register the /broadcasting/auth endpoint behind Sanctum (token auth, no
        // session) and load the private-channel authorization callbacks.
        Broadcast::routes(['middleware' => ['auth:sanctum']]);
        require base_path('routes/channels.php');
    }
}
