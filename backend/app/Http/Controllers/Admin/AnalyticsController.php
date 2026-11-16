<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Marketing;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shipment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    private const REGIONS = ['Luzon', 'Visayas', 'Mindanao'];
    private const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    public function overview()
    {
        return [
            'customers' => Customer::count(),
            'products' => Product::count(),
            'sales' => Sale::count(),
            'marketing' => Marketing::count(),
            'shipments' => Shipment::count(),
            'unlock_requests' => User::whereNotNull('customer_id')->where('locked', true)->whereNotNull('unlock_request')->count(),
        ];
    }

    public function dashboard(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $days = in_array($days, [7, 30, 90]) ? $days : 30;

        $today = now()->startOfDay();
        $curStart = $today->copy()->subDays($days - 1);
        $prevStart = $curStart->copy()->subDays($days);
        $curFrom = $curStart->toDateString();

        $sales = Sale::with(['product', 'customer'])
            ->whereBetween('sale_date', [$prevStart->toDateString(), $today->toDateString()])
            ->get();

        $cur = $sales->filter(fn ($sale) => $sale->sale_date >= $curFrom);
        $prev = $sales->filter(fn ($sale) => $sale->sale_date < $curFrom);

        $series = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $curStart->copy()->addDays($i)->toDateString();
            $daySales = $cur->where('sale_date', $day);
            $series[] = [
                'day' => $day,
                'revenue' => $this->revenue($daySales),
                'orders' => $daySales->count(),
            ];
        }

        $category = $cur->groupBy(fn ($sale) => $sale->product->category)
            ->map(fn ($group, $name) => [
                'category' => $name,
                'revenue' => $this->revenue($group),
            ])
            ->sortByDesc('revenue')
            ->values();

        $top = $cur->groupBy('product_id')
            ->map(fn ($group) => [
                'name' => $group->first()->product->name,
                'revenue' => $this->revenue($group),
                'units' => (int) $group->sum('qty'),
            ])
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        $recent = Sale::with(['customer', 'product', 'shipment'])
            ->orderByDesc('id')
            ->take(8)
            ->get()
            ->map(fn ($sale) => [
                'id' => $sale->id,
                'sale_date' => $sale->sale_date,
                'customer' => $sale->customer?->name,
                'product' => $sale->product?->name,
                'qty' => $sale->qty,
                'total' => $sale->qty * ($sale->product?->price ?? 0),
                'status' => $sale->shipment?->status ?? $sale->status,
            ]);

        return [
            'cur' => $this->summary($cur),
            'prev' => $this->summary($prev),
            'newCustomers' => [
                'cur' => Customer::whereBetween('joined', [$curFrom, $today->toDateString()])->count(),
                'prev' => Customer::where('joined', '>=', $prevStart->toDateString())->where('joined', '<', $curFrom)->count(),
            ],
            'customers' => [
                'total' => Customer::count(),
                'locked' => User::whereNotNull('customer_id')->where('locked', true)->count(),
            ],
            'series' => $series,
            'category' => $category,
            'top' => $top,
            'lowStock' => Product::where('stock', '<=', 5)->orderBy('stock')->get(['id', 'name', 'category', 'stock']),
            'recent' => $recent,
        ];
    }

    public function descriptive(Request $request)
    {
        $region = $this->region($request);
        $days = (int) $request->query('days', 30);
        $days = in_array($days, [0, 7, 30, 90]) ? $days : 30;
        $today = now()->startOfDay();

        $all = Sale::with(['product', 'customer'])->get();
        $inRegion = $this->inRegion($all, $region);

        if ($days) {
            $curFrom = $today->copy()->subDays($days - 1)->toDateString();
            $prevFrom = $today->copy()->subDays($days * 2 - 1)->toDateString();
            $cur = $inRegion->filter(fn ($sale) => $sale->sale_date >= $curFrom);
            $prev = $inRegion->filter(fn ($sale) => $sale->sale_date >= $prevFrom && $sale->sale_date < $curFrom);
            $allCur = $all->filter(fn ($sale) => $sale->sale_date >= $curFrom);

            $series = collect(range($days - 1, 0))->map(function ($ago) use ($today, $cur) {
                $day = $today->copy()->subDays($ago)->toDateString();

                return ['label' => substr($day, 5)] + $this->money($cur->where('sale_date', $day));
            })->values();
        } else {
            $cur = $inRegion;
            $prev = null;
            $allCur = $all;

            $series = $cur->groupBy(fn ($sale) => substr($sale->sale_date, 0, 7))
                ->sortKeys()
                ->map(fn ($group, $month) => ['label' => $month] + $this->money($group))
                ->values();
        }

        $weekday = collect(self::WEEKDAYS)->map(fn ($name, $i) => [
            'name' => $name,
            'revenue' => $this->revenue($cur->filter(fn ($sale) => Carbon::parse($sale->sale_date)->dayOfWeekIso === $i + 1)),
        ]);

        $topProducts = $cur->groupBy('product_id')
            ->map(fn ($group, $id) => [
                'id' => $id,
                'name' => $group->first()->product->name,
                'units' => (int) $group->sum('qty'),
            ] + $this->money($group))
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        $topCustomers = $cur->groupBy('customer_id')
            ->map(fn ($group, $id) => [
                'id' => $id,
                'name' => $group->first()->customer?->name,
                'region' => $group->first()->customer?->region,
                'orders' => $group->count(),
                'revenue' => $this->revenue($group),
            ])
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        return [
            'days' => $days,
            'cur' => $this->summary($cur),
            'prev' => $prev ? $this->summary($prev) : null,
            'series' => $series,
            'category' => $this->groupMoney($cur, fn ($sale) => $sale->product->category),
            'regions' => $this->groupMoney($allCur, fn ($sale) => $sale->customer?->region ?? 'Unknown'),
            'customerType' => $this->groupMoney($cur, fn ($sale) => $sale->customer?->type ?? 'Unknown'),
            'channel' => $this->groupMoney($cur, fn ($sale) => $sale->channel),
            'weekday' => $weekday,
            'topProducts' => $topProducts,
            'topCustomers' => $topCustomers,
        ];
    }

    public function predictive(Request $request)
    {
        $region = $this->region($request);
        $today = now()->startOfDay();
        $sales = $this->inRegion(Sale::with(['product', 'customer'])->get(), $region);

        $history = collect(range(59, 0))->map(function ($ago) use ($today, $sales) {
            $day = $today->copy()->subDays($ago)->toDateString();

            return ['day' => $day, 'revenue' => $this->revenue($sales->where('sale_date', $day))];
        })->values();

        [$slope, $intercept] = $this->regression($history->pluck('revenue')->all());

        $daily = [];
        foreach ($history as $i => $row) {
            $from = max(0, $i - 6);
            $daily[] = [
                'date' => substr($row['day'], 5),
                'actual' => round($history->slice($from, $i - $from + 1)->avg('revenue'), 2),
                'forecast' => null,
            ];
        }
        $daily[59]['forecast'] = round(max(0, $intercept + $slope * 59), 2);

        $next30 = 0;
        for ($i = 1; $i <= 30; $i++) {
            $value = max(0, $intercept + $slope * (59 + $i));
            $next30 += $value;
            $daily[] = [
                'date' => $today->copy()->addDays($i)->format('m-d'),
                'actual' => null,
                'forecast' => round($value, 2),
            ];
        }

        $byMonth = $sales->groupBy(fn ($sale) => substr($sale->sale_date, 0, 7))
            ->map(fn ($group) => $this->revenue($group))
            ->sortKeys();

        $monthly = [];
        $monthlySlope = 0;

        if ($byMonth->count() >= 2) {
            $start = Carbon::parse($byMonth->keys()->first() . '-01');
            $end = $today->copy()->startOfMonth();

            $months = [];
            for ($m = $start->copy(); $m->lte($end); $m->addMonth()) {
                $months[$m->format('Y-m')] = $byMonth[$m->format('Y-m')] ?? 0;
            }

            [$monthlySlope, $monthlyIntercept] = $this->regression(array_values($months));

            $i = 0;
            foreach ($months as $month => $value) {
                $monthly[] = [
                    'month' => $month,
                    'actual' => $value,
                    'trend' => round(max(0, $monthlyIntercept + $monthlySlope * $i), 2),
                    'forecast' => null,
                ];
                $i++;
            }
            $monthly[$i - 1]['forecast'] = $monthly[$i - 1]['actual'];

            for ($k = 1; $k <= 3; $k++) {
                $value = round(max(0, $monthlyIntercept + $monthlySlope * ($i - 1 + $k)), 2);
                $monthly[] = [
                    'month' => $end->copy()->addMonths($k)->format('Y-m'),
                    'actual' => null,
                    'trend' => $value,
                    'forecast' => $value,
                ];
            }
        }

        $joined = Customer::when($region !== 'All', fn ($q) => $q->where('region', $region))->pluck('joined');

        $weekly = collect(range(7, 0))->map(function ($ago) use ($today, $joined) {
            $start = $today->copy()->startOfWeek()->subWeeks($ago);
            $from = $start->toDateString();
            $to = $start->copy()->addDays(6)->toDateString();

            return [
                'week' => $start->format('m-d'),
                'customers' => $joined->filter(fn ($date) => $date >= $from && $date <= $to)->count(),
            ];
        })->values();

        $perWeek = round($weekly->slice(-4)->avg('customers'), 2);

        return [
            'next30' => round($next30, 2),
            'last30' => round($history->slice(-30)->sum('revenue'), 2),
            'slope' => round($slope, 2),
            'daily' => $daily,
            'monthly' => $monthly,
            'monthlySlope' => round($monthlySlope, 2),
            'stockout' => $this->stockRows($today)->map(fn ($row) => $row + ['status' => $this->stockStatus($row)]),
            'customers' => [
                'perWeek' => $perWeek,
                'next4' => (int) round($perWeek * 4),
                'weekly' => $weekly,
            ],
        ];
    }

    public function prescriptive(Request $request)
    {
        $budget = max(0, (float) $request->query('budget', 500000));
        $today = now()->startOfDay();
        $sales = Sale::with('product')->get();

        $rows = Marketing::selectRaw('channel, SUM(spend) as spend')
            ->groupBy('channel')
            ->pluck('spend', 'channel')
            ->map(function ($spent, $channel) use ($sales) {
                $revenue = $this->revenue($sales->where('channel', $channel));

                return [
                    'channel' => $channel,
                    'spend' => (float) $spent,
                    'revenue' => $revenue,
                    'roi' => $spent > 0 ? round($revenue / $spent, 2) : 0,
                ];
            })
            ->values();

        $totalRoi = $rows->sum('roi');

        $allocation = $rows->map(fn ($row) => $row + [
            'allocate' => $totalRoi > 0
                ? round($budget * $row['roi'] / $totalRoi)
                : round($budget / max(1, $rows->count())),
        ])->sortByDesc('roi')->values();

        $stock = $this->stockRows($today);

        $restock = $stock->filter(fn ($row) => $row['perDay'] > 0)
            ->map(function ($row) {
                $qty = max(0, (int) ceil($row['perDay'] * 37) - $row['stock']);
                $level = $row['stock'] < 1 || $row['left'] < 7 ? 'urgent' : ($row['left'] < 14 ? 'soon' : 'tip');

                return $row + [
                    'qty' => $qty,
                    'cost' => round($qty * $row['unit_cost'], 2),
                    'level' => $level,
                ];
            })
            ->filter(fn ($row) => $row['qty'] > 0)
            ->sortBy('left')
            ->values();

        $margin = Product::orderBy('id')->get()
            ->filter(fn ($p) => $p->price > 0 && ($p->price - $p->unit_cost) / $p->price < 0.2)
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'price' => $p->price,
                'margin' => round(($p->price - $p->unit_cost) / $p->price * 100, 1),
                'suggested' => round($p->unit_cost / 0.75),
            ])
            ->values();

        $slow = $stock->filter(fn ($row) => $row['stock'] > 0 && $row['perDay'] == 0)
            ->map(fn ($row) => [
                'id' => $row['id'],
                'name' => $row['name'],
                'stock' => $row['stock'],
                'tied' => round($row['stock'] * $row['unit_cost'], 2),
            ])
            ->sortByDesc('tied')
            ->values();

        $shipping = Shipment::selectRaw('region, AVG(cost) as avg_cost, AVG(days) as avg_days, COUNT(*) as shipments')
            ->whereNotNull('region')
            ->groupBy('region')
            ->orderBy('avg_cost')
            ->get()
            ->map(fn ($s) => [
                'region' => $s->region,
                'avg_cost' => round($s->avg_cost),
                'avg_days' => round($s->avg_days, 1),
                'shipments' => (int) $s->shipments,
            ]);

        $actions = [];

        foreach ($stock->where('stock', '<', 1) as $row) {
            $actions[] = ['level' => 'urgent', 'text' => "{$row['name']} is out of stock. Restock it so customers can order it again."];
        }

        foreach ($restock->where('level', 'urgent') as $row) {
            if ($row['stock'] >= 1) {
                $actions[] = ['level' => 'urgent', 'text' => "Order {$row['qty']} more {$row['name']}. At the current pace it runs out in about " . max(1, (int) floor($row['left'])) . ' days.'];
            }
        }

        foreach ($restock->where('level', 'soon') as $row) {
            $actions[] = ['level' => 'soon', 'text' => "Plan a restock of {$row['qty']} {$row['name']} within the next two weeks."];
        }

        foreach ($margin as $row) {
            $actions[] = ['level' => 'soon', 'text' => "{$row['name']} only earns {$row['margin']}% per sale. Raise the price to about ₱" . number_format($row['suggested']) . ' for a 25% margin, or find a cheaper supplier.'];
        }

        $best = $allocation->first();
        if ($best && $best['roi'] > 0) {
            $actions[] = ['level' => 'tip', 'text' => "{$best['channel']} returns ₱{$best['roi']} for every ₱1 spent, the best of all channels. Give it the biggest share of the marketing budget."];
        }

        $cheapest = $shipping->first();
        if ($cheapest && $shipping->count() > 1) {
            $actions[] = ['level' => 'tip', 'text' => "Shipping to {$cheapest['region']} is the cheapest at about ₱" . number_format($cheapest['avg_cost']) . " per order ({$cheapest['avg_days']} days). Focus delivery promos there first."];
        }

        if ($slow->isNotEmpty()) {
            $actions[] = ['level' => 'tip', 'text' => "{$slow->count()} product(s) had no sales in the last 30 days, with ₱" . number_format($slow->sum('tied')) . ' tied up in stock. Try a promo or a bundle.'];
        }

        return [
            'actions' => $actions,
            'allocation' => $allocation,
            'restock' => $restock,
            'margin' => $margin,
            'slow' => $slow,
            'shipping' => $shipping,
        ];
    }

    private function region(Request $request): string
    {
        $region = $request->query('region', 'All');

        return in_array($region, self::REGIONS) ? $region : 'All';
    }

    private function inRegion($sales, string $region)
    {
        return $region === 'All'
            ? $sales
            : $sales->filter(fn ($sale) => $sale->customer?->region === $region)->values();
    }

    private function stockRows($today)
    {
        $sold = Sale::where('sale_date', '>=', $today->copy()->subDays(29)->toDateString())
            ->selectRaw('product_id, SUM(qty) as units')
            ->groupBy('product_id')
            ->pluck('units', 'product_id');

        return Product::orderBy('id')->get()->map(function ($p) use ($sold, $today) {
            $perDay = round(((int) ($sold[$p->id] ?? 0)) / 30, 2);
            $left = $perDay > 0 ? round($p->stock / $perDay, 1) : null;

            return [
                'id' => $p->id,
                'name' => $p->name,
                'stock' => $p->stock,
                'perDay' => $perDay,
                'left' => $left,
                'date' => $left !== null ? $today->copy()->addDays((int) floor($left))->toDateString() : null,
                'unit_cost' => $p->unit_cost,
            ];
        });
    }

    private function stockStatus(array $row): string
    {
        if ($row['stock'] < 1) {
            return 'out';
        }

        if ($row['left'] === null) {
            return 'idle';
        }

        if ($row['left'] < 7) {
            return 'critical';
        }

        return $row['left'] < 14 ? 'low' : 'ok';
    }

    private function regression(array $values): array
    {
        $n = count($values);

        if ($n < 2) {
            return [0, $values[0] ?? 0];
        }

        $meanX = ($n - 1) / 2;
        $meanY = array_sum($values) / $n;
        $num = 0;
        $den = 0;

        foreach (array_values($values) as $x => $y) {
            $num += ($x - $meanX) * ($y - $meanY);
            $den += ($x - $meanX) ** 2;
        }

        $slope = $den ? $num / $den : 0;

        return [$slope, $meanY - $slope * $meanX];
    }

    private function groupMoney($sales, callable $key)
    {
        return $sales->groupBy($key)
            ->map(fn ($group, $name) => ['name' => $name] + $this->money($group))
            ->sortByDesc('revenue')
            ->values();
    }

    private function summary($sales): array
    {
        return [
            'revenue' => $this->revenue($sales),
            'profit' => $this->profit($sales),
            'orders' => $sales->count(),
            'units' => (int) $sales->sum('qty'),
            'buyers' => $sales->pluck('customer_id')->unique()->count(),
        ];
    }

    private function money($sales): array
    {
        return [
            'revenue' => $this->revenue($sales),
            'profit' => $this->profit($sales),
        ];
    }

    private function revenue($sales): float
    {
        return round($sales->sum(fn ($sale) => $sale->qty * $sale->product->price), 2);
    }

    private function profit($sales): float
    {
        return round($sales->sum(fn ($sale) => $sale->qty * ($sale->product->price - $sale->product->unit_cost)), 2);
    }
}