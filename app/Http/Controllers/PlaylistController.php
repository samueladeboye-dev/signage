<?php

namespace App\Http\Controllers;

use App\Models\Media;
use App\Models\Playlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlaylistController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Playlist::class);

        $playlists = Playlist::withCount('items')
            ->with('screens')
            ->orderBy('name')
            ->get()
            ->map(fn (Playlist $playlist) => [
                'id' => $playlist->id,
                'name' => $playlist->name,
                'description' => $playlist->description,
                'is_looping' => $playlist->is_looping,
                'default_image_duration' => $playlist->default_image_duration,
                'items_count' => $playlist->items_count,
                'screens_count' => $playlist->screens->count(),
                'created_at' => $playlist->created_at->toISOString(),
            ]);

        return Inertia::render('playlists/index', [
            'playlists' => $playlists,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Playlist::class);

        return Inertia::render('playlists/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Playlist::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_looping' => ['boolean'],
            'default_image_duration' => ['integer', 'min:1', 'max:3600'],
        ]);

        $playlist = Playlist::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        return redirect()->route('playlists.show', $playlist)
            ->with('success', 'Playlist created.');
    }

    public function show(Playlist $playlist): Response
    {
        $this->authorize('view', $playlist);

        $playlist->load('items.media');

        $availableMedia = Media::ready()
            ->orderBy('name')
            ->get()
            ->map(fn (Media $media) => [
                'id' => $media->id,
                'name' => $media->name,
                'type' => $media->type,
                'duration' => $media->duration,
                'thumbnail_url' => $media->thumbnail_url,
                'size' => $media->size,
            ]);

        return Inertia::render('playlists/show', [
            'playlist' => [
                'id' => $playlist->id,
                'name' => $playlist->name,
                'description' => $playlist->description,
                'is_looping' => $playlist->is_looping,
                'default_image_duration' => $playlist->default_image_duration,
                'items' => $playlist->items->map(fn ($item) => [
                    'id' => $item->id,
                    'sort_order' => $item->sort_order,
                    'duration' => $item->duration,
                    'effective_duration' => $item->effectiveDuration(),
                    'media' => [
                        'id' => $item->media->id,
                        'name' => $item->media->name,
                        'type' => $item->media->type,
                        'thumbnail_url' => $item->media->thumbnail_url,
                        'duration' => $item->media->duration,
                    ],
                ]),
            ],
            'availableMedia' => $availableMedia,
        ]);
    }

    public function update(Request $request, Playlist $playlist): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'is_looping' => ['boolean'],
            'default_image_duration' => ['integer', 'min:1', 'max:3600'],
        ]);

        $playlist->update($validated);

        return back()->with('success', 'Playlist updated.');
    }

    public function destroy(Playlist $playlist): RedirectResponse
    {
        $this->authorize('delete', $playlist);

        $playlist->delete();

        return redirect()->route('playlists.index')
            ->with('success', 'Playlist deleted.');
    }
}
