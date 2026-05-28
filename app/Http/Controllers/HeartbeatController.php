<?php

namespace App\Http\Controllers;

use App\Events\ScreenStatusChanged;
use App\Models\Screen;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HeartbeatController extends Controller
{
    /**
     * Record a heartbeat from a screen player.
     * No authentication required — public endpoint.
     */
    public function store(Request $request, string $pairingCode): JsonResponse
    {
        $screen = Screen::where('pairing_code', $pairingCode)->firstOrFail();

        $wasOffline = $screen->status === 'offline';

        $screen->markOnline();

        if ($wasOffline) {
            broadcast(new ScreenStatusChanged($screen));
        }

        $response = [
            'status' => 'ok',
            'timestamp' => now()->toISOString(),
        ];

        // Return current playlist info so the player can check for updates
        if ($screen->currentPlaylist) {
            $response['playlist_id'] = $screen->current_playlist_id;
            $response['playlist_updated_at'] = $screen->currentPlaylist->updated_at->toISOString();
        } else {
            $response['playlist_id'] = null;
        }

        return response()->json($response);
    }
}
