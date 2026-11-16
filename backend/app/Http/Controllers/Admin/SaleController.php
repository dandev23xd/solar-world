<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;

class SaleController extends Controller
{
    public function index()
    {
        return Sale::with(['customer', 'product'])
            ->orderByDesc('id')
            ->get()
            ->map(fn ($sale) => [
                'id' => $sale->id,
                'customer_id' => $sale->customer_id,
                'customer' => $sale->customer?->name,
                'phone' => $sale->customer?->phone,
                'address' => $sale->customer?->address,
                'product_id' => $sale->product_id,
                'product' => $sale->product?->name,
                'category' => $sale->product?->category,
                'qty' => $sale->qty,
                'sale_date' => $sale->sale_date,
                'est_delivery' => $sale->est_delivery,
                'channel' => $sale->channel,
                'status' => $sale->status,
                'total' => $sale->qty * ($sale->product?->price ?? 0),
            ]);
    }
}