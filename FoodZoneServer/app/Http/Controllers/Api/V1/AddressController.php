<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->latest()->get();

        return ApiResponse::success($addresses, 'Addresses retrieved.');
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateAddress($request);
        $me = $request->user();

        $address = DB::transaction(function () use ($me, $data) {
            $isFirst = $me->addresses()->count() === 0;
            $data['is_default'] = $data['is_default'] ?? $isFirst;

            if ($data['is_default']) {
                $me->addresses()->update(['is_default' => false]);
            }

            return $me->addresses()->create($data);
        });

        return ApiResponse::success($address, 'Address added.', 201);
    }

    public function update(Request $request, UserAddress $address): JsonResponse
    {
        $this->assertOwner($request, $address);
        $data = $this->validateAddress($request);

        DB::transaction(function () use ($request, $address, $data) {
            if (! empty($data['is_default'])) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }
            $address->update($data);
        });

        return ApiResponse::success($address->fresh(), 'Address updated.');
    }

    public function destroy(Request $request, UserAddress $address): JsonResponse
    {
        $this->assertOwner($request, $address);
        $address->delete();

        return ApiResponse::success(null, 'Address deleted.');
    }

    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'label' => ['nullable', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'pincode' => ['required', 'string', 'max:20'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric', 'between:-90,90'],
            'lng' => ['nullable', 'numeric', 'between:-180,180'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }

    private function assertOwner(Request $request, UserAddress $address): void
    {
        if ($address->user_id !== $request->user()->id) {
            abort(403, 'This address does not belong to you.');
        }
    }
}
