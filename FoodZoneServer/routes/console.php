<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-cancel orders vendors never accepted (spec §6.4).
Schedule::command('orders:cancel-stale')->everyMinute();

// Purge accounts whose 30-day deletion grace period has elapsed (spec §8.2).
Schedule::command('users:purge-deleted')->daily();
