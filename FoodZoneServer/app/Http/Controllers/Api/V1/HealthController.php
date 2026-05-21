<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class HealthController extends Controller
{
    /** Aggregate system health (spec section 23.3). */
    public function index(): JsonResponse
    {
        $services = [
            'database' => $this->database(),
            'cache' => $this->cache(),
            'queue' => $this->queue(),
            'storage' => $this->storage(),
        ];

        $healthy = collect($services)->every(fn ($s) => $s['status'] === 'up');

        return response()->json([
            'status' => $healthy ? 'healthy' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'version' => config('app.version', '1.0.0'),
            'services' => $services,
        ], $healthy ? 200 : 503);
    }

    public function database(): array
    {
        return $this->check(function () {
            $start = microtime(true);
            DB::connection()->getPdo();
            DB::select('SELECT 1');

            return ['latency_ms' => round((microtime(true) - $start) * 1000, 2)];
        });
    }

    public function cache(): array
    {
        return $this->check(function () {
            Cache::put('health:ping', '1', 5);
            $ok = Cache::get('health:ping') === '1';

            return ['writable' => $ok];
        });
    }

    public function queue(): array
    {
        return $this->check(function () {
            $pending = DB::table('jobs')->count();
            $failed = DB::table('failed_jobs')->count();

            return ['pending_jobs' => $pending, 'failed_jobs' => $failed];
        });
    }

    public function storage(): array
    {
        return $this->check(function () {
            $disk = Storage::disk(config('filesystems.default'));
            $disk->put('health/ping.txt', (string) now());
            $exists = $disk->exists('health/ping.txt');

            return ['disk' => config('filesystems.default'), 'writable' => $exists];
        });
    }

    /** Wrap a probe so a failure becomes a structured "down" entry, never a 500. */
    private function check(callable $probe): array
    {
        try {
            return array_merge(['status' => 'up'], $probe());
        } catch (Throwable $e) {
            return ['status' => 'down', 'error' => $e->getMessage()];
        }
    }
}
