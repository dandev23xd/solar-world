<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Marketing;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shipment;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    private const REGIONS = ['Luzon', 'Visayas', 'Mindanao'];
    private const TYPES = ['Residential', 'Commercial'];
    private const CHANNELS = ['Facebook', 'Google Ads', 'Email', 'Referral', 'Trade Show'];

    public function run(): void
    {
        $productIds = Product::pluck('id')->all();

        $customers = collect(range(1, 60))->map(fn ($i) => Customer::create([
            'name' => "Customer {$i}",
            'region' => self::REGIONS[array_rand(self::REGIONS)],
            'type' => self::TYPES[array_rand(self::TYPES)],
            'joined' => now()->subDays(rand(30, 700))->toDateString(),
        ]));

        foreach (range(1, 60) as $i) {
            Marketing::create([
                'channel' => self::CHANNELS[$i % 5],
                'campaign' => "Campaign {$i}",
                'spend' => rand(5000, 50000),
                'leads' => rand(10, 200),
                'start_date' => now()->subDays(rand(1, 365))->toDateString(),
            ]);
        }

        foreach (range(1, 120) as $i) {
            $customer = $customers->random();
            $days = rand(2, 11);
            $date = now()->subDays(rand(1, 365));

            $sale = Sale::create([
                'customer_id' => $customer->id,
                'product_id' => $productIds[array_rand($productIds)],
                'qty' => rand(1, 5),
                'sale_date' => $date->toDateString(),
                'channel' => self::CHANNELS[array_rand(self::CHANNELS)],
                'est_delivery' => $date->copy()->addDays($days)->toDateString(),
                'status' => 'Delivered',
            ]);

            Shipment::create([
                'sale_id' => $sale->id,
                'region' => $customer->region,
                'cost' => rand(500, 5000),
                'days' => $days,
                'status' => 'Delivered',
            ]);
        }
    }
}