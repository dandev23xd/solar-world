<?php

use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CustomerController;
use App\Http\Controllers\Admin\MarketingController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\SaleController;
use App\Http\Controllers\Admin\ShipmentController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Shop\AccountController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Shop\ProductController as ShopProductController;
use App\Http\Middleware\EnsureNotLocked;
use App\Http\Middleware\IsAdmin;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/unlock-request', [AuthController::class, 'requestUnlock'])->middleware('throttle:5,1');
Route::post('/forgot', [PasswordResetController::class, 'forgot']);
Route::post('/reset', [PasswordResetController::class, 'reset']);

Route::middleware(['auth:sanctum', EnsureNotLocked::class])->prefix('shop')->group(function () {
    Route::get('/products', [ShopProductController::class, 'index']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
    Route::get('/profile', [AccountController::class, 'show']);
    Route::put('/profile', [AccountController::class, 'update']);
    Route::put('/email', [AccountController::class, 'email']);
    Route::put('/password', [AccountController::class, 'password']);
});

Route::middleware(['auth:sanctum', EnsureNotLocked::class, IsAdmin::class])->group(function () {
    Route::get('/overview', [AnalyticsController::class, 'overview']);
    Route::get('/dashboard', [AnalyticsController::class, 'dashboard']);
    Route::get('/descriptive', [AnalyticsController::class, 'descriptive']);
    Route::get('/predictive', [AnalyticsController::class, 'predictive']);
    Route::get('/prescriptive', [AnalyticsController::class, 'prescriptive']);

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::put('/customers/{id}/lock', [CustomerController::class, 'lock']);
    Route::put('/customers/{id}/dismiss-request', [CustomerController::class, 'dismissRequest']);

    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    Route::get('/sales', [SaleController::class, 'index']);

    Route::get('/marketing', [MarketingController::class, 'index']);
    Route::post('/marketing', [MarketingController::class, 'store']);
    Route::put('/marketing/{id}', [MarketingController::class, 'update']);
    Route::delete('/marketing/{id}', [MarketingController::class, 'destroy']);

    Route::get('/shipments', [ShipmentController::class, 'index']);
    Route::put('/shipments/{id}', [ShipmentController::class, 'update']);
});