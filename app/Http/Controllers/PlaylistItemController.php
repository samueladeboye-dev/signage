<?php

namespace App\Http\Controllers;

use App\Events\ScreenRefreshRequested;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PlaylistItemController extends Controller
{
    public function store(Request $request, Playlist $playlist): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $validated = $request->validate([
            'media_id' => ['required', 'exists:media,id'],
            'duration' => ['nullable', 'integer', 'min:1', 'max:3600'],
        ]);

        $maxOrder = $playlist->items()->max('sort_order') ?? -1;

        $playlist->items()->create([
            'media_id' => $validated['media_id'],
            'duration' => $validated['duration'] ?? null,
            'sort_order' => $maxOrder + 1,
        ]);

        $this->notifyScreens($playlist);

        return back()->with('success', 'Media added to playlist.');
    }

    public function update(Request $request, Playlist $playlist, PlaylistItem $item): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $validated = $request->validate([
            'duration' => ['nullable', 'integer', 'min:1', 'max:3600'],
        ]);

        $item->update($validated);

        $this->notifyScreens($playlist);

        return back()->with('success', 'Item updated.');
    }

    public function destroy(Playlist $playlist, PlaylistItem $item): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $item->delete();

        $this->notifyScreens($playlist);

        return back()->with('success', 'Item removed.');
    }

    public function reorder(Request $request, Playlist $playlist): RedirectResponse
    {
        $this->authorize('update', $playlist);

        $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'exists:playlist_items,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->items as $itemData) {
            PlaylistItem::where('id', $itemData['id'])
                ->where('playlist_id', $playlist->id)
                ->update(['sort_order' => $itemData['sort_order']]);
        }

        $this->notifyScreens($playlist);

        return back();
    }

    private function notifyScreens(Playlist $playlist): void
    {
        $playlist->loadMissing('screens');

        foreach ($playlist->screens as $screen) {
            broadcast(new ScreenRefreshRequested($screen));
        }
    }
}
