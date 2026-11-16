<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index()
    {
        return Customer::with('user')
            ->orderBy('id')
            ->get()
            ->map(function ($customer) {
                $user = $customer->user;

                if (! $user) {
                    $status = 'No account';
                } elseif ($user->locked && $user->unlock_request) {
                    $status = 'Unlock requested';
                } elseif ($user->locked) {
                    $status = 'Locked';
                } else {
                    $status = 'Active';
                }

                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'address' => $customer->address,
                    'region' => $customer->region,
                    'type' => $customer->type,
                    'joined' => $customer->joined,
                    'email' => $user?->email,
                    'locked' => (bool) $user?->locked,
                    'status' => $status,
                    'lock_reason' => $user?->lock_reason,
                    'unlock_request' => $user?->unlock_request,
                    'unlock_requested_at' => $user?->unlock_requested_at?->format('Y-m-d H:i'),
                ];
            });
    }

    public function lock(Request $request, $id)
    {
        $data = $request->validate([
            'locked' => 'required|boolean',
            'reason' => 'nullable|string|max:255',
        ]);

        $customer = Customer::with('user')->find($id);

        if (! $customer) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        if (! $customer->user) {
            return response()->json(['error' => 'This customer has no account to lock'], 422);
        }

        $customer->user->update([
            'locked' => $data['locked'],
            'lock_reason' => $data['locked'] ? ($data['reason'] ?? null) : null,
            'unlock_request' => null,
            'unlock_requested_at' => null,
        ]);

        return ['ok' => true];
    }

    public function dismissRequest($id)
    {
        $customer = Customer::with('user')->find($id);

        if (! $customer || ! $customer->user) {
            return response()->json(['error' => 'Customer not found'], 404);
        }

        $customer->user->update([
            'unlock_request' => null,
            'unlock_requested_at' => null,
        ]);

        return ['ok' => true];
    }
}