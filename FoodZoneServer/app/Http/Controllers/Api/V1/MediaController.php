<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MediaController extends Controller
{
    /**
     * Upload an image and return its (absolute) URL.
     * The storage disk is env-driven (local public disk by default, S3/CDN in prod).
     */
    public function store(Request $request): JsonResponse
    {
        $maxKb = (int) config('media.max_kb', 5120);
        $mimes = implode(',', config('media.mimes', ['jpeg', 'jpg', 'png', 'webp', 'gif']));

        $request->validate([
            'file' => ['required', 'file', 'image', "mimes:{$mimes}", "max:{$maxKb}"],
            'category' => ['nullable', Rule::in(['avatar', 'cover', 'post', 'story', 'vendor', 'menu', 'misc'])],
        ]);

        $category = $request->input('category', 'misc');
        $disk = config('media.disk', 'public');

        $path = $request->file('file')->store("uploads/{$category}", $disk);
        $url = Storage::disk($disk)->url($path);

        // Public disk returns a root-relative path; make it absolute for cross-origin clients.
        if (! Str::startsWith($url, ['http://', 'https://'])) {
            $url = url($url);
        }

        // Local-disk URLs are minted from APP_URL, which mobile emulators/devices
        // can't reach (localhost = the device itself). Rebuild from the host the
        // client actually used (e.g. 10.0.2.2:8000 or the LAN IP) so the returned
        // URL is loadable by whoever uploaded it.
        if ($disk === 'public') {
            $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
            $urlHost = parse_url($url, PHP_URL_HOST);
            if ($urlHost === $appHost) {
                $url = $request->getSchemeAndHttpHost().parse_url($url, PHP_URL_PATH);
            }
        }

        return ApiResponse::success([
            'url' => $url,
            'path' => $path,
            'disk' => $disk,
        ], 'File uploaded.', 201);
    }
}
