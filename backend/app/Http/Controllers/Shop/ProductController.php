<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        return Product::orderBy('id')->get([
            'id',
            'name',
            'category',
            'price',
            'stock',
            'image_url',
            'description',
        ]);
    }
}