<?php

namespace Database\Seeders;

use App\Models\Badge;
use Illuminate\Database\Seeder;

class BadgesSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            ['key' => 'first_order',      'name' => 'First Order',       'description' => 'Placed your very first order.',         'icon' => 'utensils-crossed', 'threshold' => 1],
            ['key' => 'order_century',    'name' => 'Order Century',     'description' => 'Reached 100 delivered orders.',         'icon' => 'trophy',           'threshold' => 100],
            ['key' => 'social_butterfly', 'name' => 'Social Butterfly',  'description' => 'Earned 50 followers.',                   'icon' => 'heart',            'threshold' => 50],
            ['key' => 'food_explorer',    'name' => 'Food Explorer',     'description' => 'Ordered from 20 different restaurants.', 'icon' => 'compass',          'threshold' => 20],
        ];

        foreach ($catalog as $row) {
            Badge::updateOrCreate(['key' => $row['key']], $row);
        }
    }
}
