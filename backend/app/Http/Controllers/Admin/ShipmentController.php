<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use Illuminate\Http\Request;

class ShipmentController extends Controller
{
    public function index()
    {
        return Shipment::with(['sale.customer', 'sale.product'])
            ->orderByDesc('id')
            ->get()
            ->map(function ($shipment) {
                $sale = $shipment->sale;
                $price = $sale && $sale->product ? $sale->qty * $sale->product->price : 0;

                return [
                    'id' => $shipment->id,
                    'sale_id' => $shipment->sale_id,
                    'customer' => $sale?->customer?->name,
                    'phone' => $sale?->customer?->phone,
                    'address' => $sale?->customer?->address,
                    'product' => $sale?->product?->name,
                    'qty' => $sale?->qty,
                    'region' => $shipment->region,
                    'price' => $price,
                    'cost' => $shipment->cost,
                    'total' => $price + $shipment->cost,
                    'days' => $shipment->days,
                    'status' => $shipment->status,
                    'sale_date' => $sale?->sale_date,
                    'est_delivery' => $sale?->est_delivery,
                ];
            });
    }

    public function update(Request $request, $id)
    {
        $shipment = Shipment::with('sale')->find($id);

        if (! $shipment) {
            return response()->json(['error' => 'Shipment not found'], 404);
        }

        $shipment->update($request->validate([
            'region' => 'required|in:Luzon,Visayas,Mindanao',
            'cost' => 'required|numeric|min:0',
            'days' => 'required|integer|min:0',
            'status' => 'required|in:Preparing,Packed,Shipped,Delivered',
        ]));

        $shipment->sale?->update(['status' => $shipment->status === 'Delivered' ? 'Delivered' : 'Pending']);

        return ['ok' => true];
    }
}