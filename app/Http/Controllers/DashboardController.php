<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Playlist;
use App\Models\Screen;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'total_screens' => Screen::count(),
            'online_screens' => Screen::where('status', 'online')->count(),
            'total_media' => Media::count(),
            'total_playlists' => Playlist::count(),
        ];

        $recentScreens = Screen::with('currentPlaylist')
            ->orderBy('last_seen_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn (Screen $screen) => [
                'id' => $screen->id,
                'name' => $screen->name,
                'location' => $screen->location,
                'status' => $screen->status,
                'last_seen_at' => $screen->last_seen_at?->diffForHumans(),
                'current_playlist' => $screen->currentPlaylist?->name,
            ]);

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentScreens' => $recentScreens,
        ]);
    }
}
