<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Marketing;
use Illuminate\Http\Request;

class MarketingController extends Controller
{
    public function index()
    {
        return Marketing::orderBy('id')->get();
    }

    public function store(Request $request)
    {
        $campaign = Marketing::create($request->validate($this->rules()));

        return response()->json($campaign, 201);
    }

    public function update(Request $request, $id)
    {
        $campaign = Marketing::find($id);

        if (! $campaign) {
            return response()->json(['error' => 'Campaign not found'], 404);
        }

        $campaign->update($request->validate($this->rules()));

        return $campaign;
    }

    public function destroy($id)
    {
        $campaign = Marketing::find($id);

        if (! $campaign) {
            return response()->json(['error' => 'Campaign not found'], 404);
        }

        $campaign->delete();

        return ['ok' => true];
    }

    private function rules(): array
    {
        return [
            'channel' => 'required|in:Facebook,Google Ads,Email,Referral,Trade Show',
            'campaign' => 'required|string|max:60',
            'spend' => 'required|numeric|min:0',
            'leads' => 'required|integer|min:0',
            'start_date' => 'required|date',
        ];
    }
}