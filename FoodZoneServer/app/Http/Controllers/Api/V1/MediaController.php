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
            'category' => ['nullable', Rule::in(['avatar', 'cover', 'post', 'vendor', 'menu', 'misc'])],
        ]);

        $category = $request->input('category', 'misc');
        $disk = config('media.disk', 'public');

        $path = $request->file('file')->store("uploads/{$category}", $disk);
        $url = Storage::disk($disk)->url($path);

        // Public disk returns a root-relative path; make it absolute for cross-origin clients.
        if (! Str::startsWith($url, ['http://', 'https://'])) {
            $url = url($url);
        }

        return ApiResponse::success([
            'url' => $url,
            'path' => $path,
            'disk' => $disk,
        ], 'File uploaded.', 201);
    }
}
