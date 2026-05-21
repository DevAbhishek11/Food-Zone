<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ResolvesOwnedVendor;
use App\Http\Controllers\Controller;
use App\Http\Resources\MenuCategoryResource;
use App\Models\MenuCategory;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuCategoryController extends Controller
{
    use ResolvesOwnedVendor;

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        return ApiResponse::success(
            MenuCategoryResource::collection($vendor->categories()->orderBy('sort_order')->get()),
            'Categories loaded.'
        );
    }

    public function store(Request $request): JsonResponse
    {
        $vendor = $this->ownedVendor($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category = $vendor->categories()->create($data);

        return ApiResponse::success(new MenuCategoryResource($category), 'Category created.', 201);
    }

    public function update(Request $request, MenuCategory $category): JsonResponse
    {
        $this->assertOwns($request, $category);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:255'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $category->update($data);

        return ApiResponse::success(new MenuCategoryResource($category->fresh()), 'Category updated.');
    }

    public function destroy(Request $request, MenuCategory $category): JsonResponse
    {
        $this->assertOwns($request, $category);
        $category->delete();

        return ApiResponse::success(null, 'Category deleted.');
    }

    private function assertOwns(Request $request, MenuCategory $category): void
    {
        if ($category->vendor_id !== $this->ownedVendor($request)->id) {
            abort(403, 'This category does not belong to your store.');
        }
    }
}
