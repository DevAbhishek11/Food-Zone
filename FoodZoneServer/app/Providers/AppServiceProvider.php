<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\Payments\MockPaymentGateway;
use App\Services\Payments\RazorpayPaymentGateway;
use App\Services\Payments\StripePaymentGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\RateLimiter;
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

        $this->configureRateLimiting();
    }

    /**
     * Named rate limiters used by the `throttle:` middleware. Disabled when
     * config('hardening.rate_limit') is false (the test suite) so functional
     * tests aren't throttled.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            if (! config('hardening.rate_limit', true)) {
                return Limit::none();
            }

            return Limit::perMinute((int) config('hardening.api_per_minute', 120))
                ->by($request->user()?->id ? 'u'.$request->user()->id : 'ip'.$request->ip());
        });

        RateLimiter::for('auth', function (Request $request) {
            if (! config('hardening.rate_limit', true)) {
                return Limit::none();
            }

            return Limit::perMinute((int) config('hardening.auth_per_minute', 20))->by('auth'.$request->ip());
        });
    }
}
