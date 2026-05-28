<?php

namespace App\Http\Controllers;

use App\Events\PlaylistAssignedToScreen;
use App\Events\ScreenRefreshRequested;
use App\Models\Playlist;
use App\Models\Screen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScreenController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Screen::class);

        $screens = Screen::with('currentPlaylist')
            ->orderBy('status', 'desc')
            ->orderBy('name')
            ->get()
            ->map(fn (Screen $screen) => [
                'id' => $screen->id,
                'name' => $screen->name,
                'location' => $screen->location,
                'pairing_code' => $screen->pairing_code,
                'orientation' => $screen->orientation->value,
                'status' => $screen->status,
                'last_seen_at' => $screen->last_seen_at?->diffForHumans(),
                'current_playlist' => $screen->currentPlaylist ? [
                    'id' => $screen->currentPlaylist->id,
                    'name' => $screen->currentPlaylist->name,
                ] : null,
                'created_at' => $screen->created_at->toISOString(),
            ]);

        return Inertia::render('screens/index', [
            'screens' => $screens,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Screen::class);

        return Inertia::render('screens/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Screen::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'orientation' => ['nullable', 'string', 'in:landscape,portrait'],
        ]);

        $screen = Screen::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'pairing_code' => Screen::generatePairingCode(),
            'timezone' => $validated['timezone'] ?? 'Africa/Lagos',
            'orientation' => $validated['orientation'] ?? 'landscape',
        ]);

        return redirect()->route('screens.show', $screen)
            ->with('success', 'Screen registered successfully.');
    }

    public function show(Screen $screen): Response
    {
        $this->authorize('view', $screen);

        $screen->load('currentPlaylist', 'schedules.playlist');

        $playlists = Playlist::orderBy('name')->get(['id', 'name']);

        return Inertia::render('screens/show', [
            'screen' => [
                'id' => $screen->id,
                'name' => $screen->name,
                'location' => $screen->location,
                'description' => $screen->description,
                'pairing_code' => $screen->pairing_code,
                'orientation' => $screen->orientation->value,
                'status' => $screen->status,
                'last_seen_at' => $screen->last_seen_at?->diffForHumans(),
                'last_seen_at_raw' => $screen->last_seen_at?->toISOString(),
                'timezone' => $screen->timezone,
                'current_playlist' => $screen->currentPlaylist ? [
                    'id' => $screen->currentPlaylist->id,
                    'name' => $screen->currentPlaylist->name,
                ] : null,
                'schedules' => $screen->schedules->map(fn ($s) => [
                    'id' => $s->id,
                    'playlist' => ['id' => $s->playlist->id, 'name' => $s->playlist->name],
                    'starts_at' => $s->starts_at?->toISOString(),
                    'ends_at' => $s->ends_at?->toISOString(),
                    'is_active' => $s->is_active,
                ]),
                'created_at' => $screen->created_at->toISOString(),
            ],
            'playlists' => $playlists,
        ]);
    }

    public function update(Request $request, Screen $screen): RedirectResponse
    {
        $this->authorize('update', $screen);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'timezone' => ['nullable', 'string', 'max:100'],
            'orientation' => ['sometimes', 'string', 'in:landscape,portrait'],
            'current_playlist_id' => ['nullable', 'exists:playlists,id'],
        ]);

        $screen->update($validated);

        if ($request->has('current_playlist_id')) {
            broadcast(new PlaylistAssignedToScreen($screen))->toOthers();
        }

        return back()->with('success', 'Screen updated successfully.');
    }

    public function destroy(Screen $screen): RedirectResponse
    {
        $this->authorize('delete', $screen);

        $screen->delete();

        return redirect()->route('screens.index')
            ->with('success', 'Screen deleted.');
    }

    public function refresh(Screen $screen): RedirectResponse
    {
        $this->authorize('update', $screen);

        broadcast(new ScreenRefreshRequested($screen));

        return back()->with('success', 'Refresh signal sent to screen.');
    }
}
