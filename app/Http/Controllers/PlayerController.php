<?php

namespace App\Http\Controllers;

use App\Models\Screen;
use Inertia\Inertia;
use Inertia\Response;

class PlayerController extends Controller
{
    /**
     * Public player page — no auth required.
     */
    public function show(string $pairingCode): Response
    {
        $screen = Screen::where('pairing_code', $pairingCode)
            ->with(['currentPlaylist.items.media'])
            ->firstOrFail();

        $playlist = null;

        if ($screen->currentPlaylist) {
            $pl = $screen->currentPlaylist;
            $playlist = [
                'id' => $pl->id,
                'name' => $pl->name,
                'is_looping' => $pl->is_looping,
                'default_image_duration' => $pl->default_image_duration,
                'items' => $pl->items->map(fn ($item) => [
                    'id' => $item->id,
                    'sort_order' => $item->sort_order,
                    'duration' => $item->effectiveDuration(),
                    'media' => [
                        'id' => $item->media->id,
                        'name' => $item->media->name,
                        'type' => $item->media->type,
                        'url' => $item->media->hls_url,
                        'mime_type' => $item->media->mime_type,
                        'duration' => $item->media->duration,
                    ],
                ])->values(),
            ];
        }

        return Inertia::render('player/show', [
            'screen' => [
                'id' => $screen->id,
                'name' => $screen->name,
                'pairing_code' => $screen->pairing_code,
                'timezone' => $screen->timezone,
            ],
            'playlist' => $playlist,
        ]);
    }
}
