<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Post;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Voucher;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Admin ---------------------------------------------------------
        $admin = User::factory()->admin()->create([
            'name' => 'FoodZone Admin',
            'username' => 'admin',
            'email' => 'admin@foodzone.app',
        ]);

        // --- Consumers -----------------------------------------------------
        $users = User::factory(8)->create();
        $alice = User::factory()->create(['name' => 'Alice Diner', 'username' => 'alice', 'email' => 'alice@example.com']);

        // --- Vendors with menus -------------------------------------------
        Vendor::factory(4)->create()->each(function (Vendor $vendor) {
            $categories = collect(['Starters', 'Mains', 'Desserts', 'Beverages'])
                ->map(fn ($name, $i) => MenuCategory::create([
                    'vendor_id' => $vendor->id,
                    'name' => $name,
                    'sort_order' => $i,
                ]));

            foreach ($categories as $category) {
                MenuItem::factory(rand(3, 5))->create([
                    'vendor_id' => $vendor->id,
                    'category_id' => $category->id,
                ]);
            }
        });

        // --- Platform-wide welcome voucher --------------------------------
        Voucher::create([
            'vendor_id' => null,
            'code' => 'WELCOME50',
            'description' => '50 off your first order',
            'type' => 'flat',
            'amount' => 50,
            'min_order' => 200,
            'max_uses' => 1000,
            'per_user_limit' => 1,
            'is_active' => true,
            'valid_to' => now()->addMonths(3),
        ]);

        // --- Some social activity -----------------------------------------
        Post::factory(15)->recycle($users->push($alice))->create();

        // Alice follows the first three seeded users.
        foreach ($users->take(3) as $u) {
            $alice->following()->create(['following_id' => $u->id, 'status' => 'accepted']);
        }

        $this->command?->info('Seeded: admin@foodzone.app / alice@example.com (password: "password")');
    }
}
