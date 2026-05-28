<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use App\Models\Screen;
use App\Models\ScreenSchedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        $schedules = ScreenSchedule::with('screen', 'playlist')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (ScreenSchedule $s) => [
                'id' => $s->id,
                'screen' => ['id' => $s->screen->id, 'name' => $s->screen->name, 'location' => $s->screen->location],
                'playlist' => ['id' => $s->playlist->id, 'name' => $s->playlist->name],
                'starts_at' => $s->starts_at?->toISOString(),
                'ends_at' => $s->ends_at?->toISOString(),
                'is_active' => $s->is_active,
                'created_at' => $s->created_at->toISOString(),
            ]);

        $screens = Screen::orderBy('name')->get(['id', 'name', 'location']);
        $playlists = Playlist::orderBy('name')->get(['id', 'name']);

        return Inertia::render('schedules/index', [
            'schedules' => $schedules,
            'screens' => $screens,
            'playlists' => $playlists,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'screen_id' => ['required', 'exists:screens,id'],
            'playlist_id' => ['required', 'exists:playlists,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ]);

        ScreenSchedule::create($validated);

        return back()->with('success', 'Schedule created.');
    }

    public function update(Request $request, ScreenSchedule $schedule): RedirectResponse
    {
        $validated = $request->validate([
            'screen_id' => ['required', 'exists:screens,id'],
            'playlist_id' => ['required', 'exists:playlists,id'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after:starts_at'],
            'is_active' => ['boolean'],
        ]);

        $schedule->update($validated);

        return back()->with('success', 'Schedule updated.');
    }

    public function destroy(ScreenSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return back()->with('success', 'Schedule deleted.');
    }
}
