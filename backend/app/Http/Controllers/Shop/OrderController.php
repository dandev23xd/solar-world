<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    private const DELIVERY = [
        'Luzon' => ['days' => 3, 'cost' => 250],
        'Visayas' => ['days' => 5, 'cost' => 150],
        'Mindanao' => ['days' => 7, 'cost' => 350],
    ];

    public function index(Request $request)
    {
        $customer = $this->customer($request);

        return Sale::with(['product', 'shipment'])
            ->where('customer_id', $customer->id)
            ->orderByDesc('id')
            ->get()
            ->map(function ($sale) {
                $subtotal = $sale->qty * $sale->product->price;
                $shipping = (float) ($sale->shipment?->cost ?? 0);

                return [
                    'id' => $sale->id,
                    'sale_date' => $sale->sale_date,
                    'product' => $sale->product->name,
                    'category' => $sale->product->category,
                    'qty' => $sale->qty,
                    'subtotal' => $subtotal,
                    'shipping' => $shipping,
                    'total' => $subtotal + $shipping,
                    'est_delivery' => $sale->est_delivery,
                    'status' => $sale->status,
                    'can_cancel' => $this->canCancel($sale),
                ];
            });
    }

    public function store(Request $request)
    {
        $customer = $this->customer($request);

        $data = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'qty' => 'required|integer|min:1|max:50',
        ]);

        $sale = DB::transaction(function () use ($customer, $data) {
            $product = Product::lockForUpdate()->findOrFail($data['product_id']);

            if ($product->stock < $data['qty']) {
                abort(response()->json([
                    'error' => "Only {$product->stock} left in stock for {$product->name}",
                ], 409));
            }

            $product->decrement('stock', $data['qty']);

            $delivery = self::DELIVERY[$customer->region] ?? self::DELIVERY['Luzon'];

            $sale = Sale::create([
                'customer_id' => $customer->id,
                'product_id' => $product->id,
                'qty' => $data['qty'],
                'sale_date' => now()->toDateString(),
                'channel' => 'Website',
                'est_delivery' => now()->addDays($delivery['days'])->toDateString(),
                'status' => 'Pending',
            ]);

            Shipment::create([
                'sale_id' => $sale->id,
                'region' => $customer->region,
                'cost' => $delivery['cost'],
                'days' => $delivery['days'],
                'status' => 'Preparing',
            ]);

            return $sale;
        });

        return response()->json(['ok' => true, 'id' => $sale->id], 201);
    }

    public function destroy(Request $request, $id)
    {
        $customer = $this->customer($request);

        $sale = Sale::with('shipment')
            ->where('customer_id', $customer->id)
            ->find($id);

        if (! $sale) {
            return response()->json(['error' => 'Order not found'], 404);
        }

        if (! $this->canCancel($sale)) {
            return response()->json(['error' => 'This order can no longer be cancelled'], 409);
        }

        DB::transaction(function () use ($sale) {
            Product::where('id', $sale->product_id)->increment('stock', $sale->qty);
            $sale->delete();
        });

        return response()->json(['ok' => true]);
    }

    private function canCancel($sale): bool
    {
        return $sale->status === 'Pending'
            && (! $sale->shipment || $sale->shipment->status === 'Preparing');
    }

    private function customer(Request $request)
    {
        $customer = $request->user()->customer;

        abort_unless($customer, 403, 'Only buyer accounts can place orders');

        return $customer;
    }
}