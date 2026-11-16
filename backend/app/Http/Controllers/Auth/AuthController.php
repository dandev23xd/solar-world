<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:80',
            'email' => 'required|email|max:120',
            'password' => 'required|string|min:8',
            'phone' => 'required|string|max:30',
            'address' => 'required|string|max:255',
            'region' => 'required|in:Luzon,Visayas,Mindanao',
            'type' => 'required|in:Residential,Commercial',
        ]);

        $email = strtolower(trim($data['email']));

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'That email is already registered'], 409);
        }

        DB::transaction(function () use ($data, $email) {
            $customer = Customer::create([
                'name' => $data['name'],
                'region' => $data['region'],
                'type' => $data['type'],
                'joined' => now()->toDateString(),
                'phone' => $data['phone'],
                'address' => $data['address'],
            ]);

            User::create([
                'name' => $data['name'],
                'email' => $email,
                'password' => $data['password'],
                'role' => 'buyer',
                'customer_id' => $customer->id,
            ]);
        });

        return response()->json(['ok' => true], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['error' => 'Wrong email or password'], 401);
        }

        if ($user->locked) {
            return response()->json(['error' => $user->lockMessage()], 403);
        }

        $token = $user->createToken('web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'customer_id' => $user->customer_id,
            ],
        ]);
    }

    public function requestUnlock(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
            'message' => 'required|string|min:10|max:1000',
        ], [
            'message.min' => 'Please write at least 10 characters.',
        ]);

        $user = User::where('email', strtolower(trim($data['email'])))->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['error' => 'Wrong email or password'], 422);
        }

        if (! $user->locked) {
            return response()->json(['error' => 'This account is not locked. You can sign in normally.'], 422);
        }

        $user->update([
            'unlock_request' => trim($data['message']),
            'unlock_requested_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }
}