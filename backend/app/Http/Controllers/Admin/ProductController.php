<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return Product::orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $product = Product::create($request->validate($this->rules()));

        return response()->json($product, 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $product->update($request->validate($this->rules()));

        return $product;
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (! $product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        if ($product->sales()->exists()) {
            return response()->json(['error' => 'This product already has orders, so it cannot be deleted. Set its stock to 0 instead.'], 409);
        }

        $product->delete();

        return ['ok' => true];
    }

    private function rules(): array
    {
        return [
            'name' => 'required|string|max:120',
            'category' => 'required|in:Panel,Inverter,Battery,Kit,Accessory,Light,Generator,Pump',
            'price' => 'required|numeric|min:0',
            'unit_cost' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image_url' => 'nullable|string|max:1000',
            'description' => 'nullable|string|max:2000',
        ];
    }
}