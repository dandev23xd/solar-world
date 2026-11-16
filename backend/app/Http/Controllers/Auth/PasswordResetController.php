<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PasswordResetController extends Controller
{
    public function forgot(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($data['email']));
        $user = User::where('email', $email)->first();

        if (! $user) {
            return response()->json(['ok' => true]);
        }

        $token = Str::random(48);

        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            ['token' => hash('sha256', $token), 'created_at' => now()]
        );

        $link = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/?reset=' . $token;

        return response()->json(['link' => $link]);
    }

    public function reset(Request $request)
    {
        $data = $request->validate([
            'token' => 'required|string',
            'password' => 'required|string|min:8',
        ]);

        $row = DB::table('password_reset_tokens')
            ->where('token', hash('sha256', $data['token']))
            ->first();

        if (! $row || Carbon::parse($row->created_at)->addHour()->isPast()) {
            return response()->json(['error' => 'This reset link is invalid or has expired. Please request a new one.'], 400);
        }

        $user = User::where('email', $row->email)->first();

        if (! $user) {
            return response()->json(['error' => 'Account not found'], 404);
        }

        $user->update(['password' => $data['password']]);
        $user->tokens()->delete();

        DB::table('password_reset_tokens')->where('email', $row->email)->delete();

        return response()->json(['ok' => true]);
    }
}