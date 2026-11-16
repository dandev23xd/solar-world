<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AccountController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $customer = $user->customer;

        return [
            'name' => $customer->name ?? $user->name,
            'phone' => $customer->phone ?? '',
            'address' => $customer->address ?? '',
            'region' => $customer->region ?? 'Luzon',
            'type' => $customer->type ?? 'Residential',
            'email' => $user->email,
        ];
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'phone' => ['required', 'string', 'regex:/^\+?[0-9 \-]{10,20}$/'],
            'address' => 'required|string|max:255',
            'region' => 'required|in:Luzon,Visayas,Mindanao',
            'type' => 'required|in:Residential,Commercial',
        ], [
            'phone.regex' => 'Enter a valid phone number, for example 09123456789',
        ]);

        $user = $request->user();

        DB::transaction(function () use ($user, $data) {
            $user->update(['name' => $data['name']]);
            $user->customer?->update($data);
        });

        return ['ok' => true];
    }

    public function email(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|max:120',
            'current' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current'], $user->password)) {
            return response()->json(['error' => 'Your current password is wrong'], 422);
        }

        $email = strtolower(trim($data['email']));

        if (User::where('email', $email)->where('id', '!=', $user->id)->exists()) {
            return response()->json(['error' => 'That email is already used by another account'], 409);
        }

        $user->update(['email' => $email]);

        return ['ok' => true];
    }

    public function password(Request $request)
    {
        $data = $request->validate([
            'current' => 'required|string',
            'next' => 'required|string|min:8',
        ], [
            'next.min' => 'The new password must be at least 8 characters',
        ]);

        $user = $request->user();

        if (! Hash::check($data['current'], $user->password)) {
            return response()->json(['error' => 'Your current password is wrong'], 422);
        }

        $user->update(['password' => $data['next']]);

        return ['ok' => true];
    }
}