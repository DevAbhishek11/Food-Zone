<?php

namespace App\Http\Requests;

use App\Enums\PostPrivacy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:5000', 'required_without:media'],
            'privacy' => ['nullable', Rule::in(PostPrivacy::values())],
            'location' => ['nullable', 'string', 'max:255'],
            'tagged_vendor_id' => ['nullable', 'integer', 'exists:vendors,id'],
            'tagged_item_id' => ['nullable', 'integer', 'exists:menu_items,id'],
            'media' => ['nullable', 'array', 'max:10'],
            'media.*.url' => ['required_with:media', 'string', 'max:2048'],
            'media.*.type' => ['nullable', Rule::in(['image', 'video', 'gif'])],
        ];
    }

    public function messages(): array
    {
        return [
            'body.required_without' => 'A post must contain text or at least one media item.',
            'media.max' => 'A post can contain at most 10 media items.',
        ];
    }
}
