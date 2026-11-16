<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin',
            'email' => 'admin@solarworld.ph',
            'password' => 'solar123',
            'role' => 'admin',
        ]);

        $products = [
            ['100W Monocrystalline Solar Panel', 'Panel', 1800, 8],
            ['550W Solar Panel', 'Panel', 8500, 9],
            ['Hybrid Solar Inverter', 'Inverter', 49200, 10],
            ['Solar Lithium Battery', 'Battery', 42000, 10],
            ['MC4 Solar Connectors', 'Accessory', 49, 10],
            ['Solar Charge Controller', 'Accessory', 422, 10],
            ['Solar LED Floodlight', 'Light', 1500, 10],
            ['Solar Street Light', 'Light', 3300, 10],
            ['Portable Solar Power Station', 'Generator', 13991, 10],
            ['Solar Water Pump', 'Pump', 1499, 10],
        ];

        foreach ($products as [$name, $category, $price, $stock]) {
            Product::create([
                'name' => $name,
                'category' => $category,
                'price' => $price,
                'unit_cost' => round($price * 0.65, 2),
                'stock' => $stock,
            ]);
        }
    }
}