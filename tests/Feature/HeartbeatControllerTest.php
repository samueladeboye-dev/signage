<?php

use App\Events\ScreenStatusChanged;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Screen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

test('heartbeat marks screen online and updates last_seen_at', function () {
    $user = User::factory()->create();
    $screen = Screen::factory()->create([
        'created_by' => $user->id,
        'status' => 'offline',
        'last_seen_at' => now()->subMinutes(5),
    ]);

    $this->postJson("/api/screens/{$screen->pairing_code}/heartbeat")
        ->assertOk()
        ->assertJsonStructure(['status', 'timestamp', 'playlist_id']);

    $screen->refresh();
    expect($screen->status)->toBe('online');
    expect($screen->last_seen_at)->not->toBeNull();
    expect($screen->last_seen_at->diffInSeconds(now()))->toBeLessThan(5);
});

test('heartbeat returns 404 for unknown pairing code', function () {
    $this->postJson('/api/screens/UNKNOWN1/heartbeat')
        ->assertNotFound();
});

test('heartbeat broadcasts ScreenStatusChanged when screen comes online', function () {
    Event::fake([ScreenStatusChanged::class]);

    $user = User::factory()->create();
    $screen = Screen::factory()->offline()->create(['created_by' => $user->id]);

    $this->postJson("/api/screens/{$screen->pairing_code}/heartbeat")
        ->assertOk();

    Event::assertDispatched(ScreenStatusChanged::class, function ($event) use ($screen) {
        return $event->screen->id === $screen->id;
    });
});

test('heartbeat does not re-broadcast when screen is already online', function () {
    Event::fake([ScreenStatusChanged::class]);

    $user = User::factory()->create();
    $screen = Screen::factory()->online()->create(['created_by' => $user->id]);

    $this->postJson("/api/screens/{$screen->pairing_code}/heartbeat")
        ->assertOk();

    Event::assertNotDispatched(ScreenStatusChanged::class);
});

test('heartbeat response includes current playlist when assigned', function () {
    $user = User::factory()->create();
    $playlist = Playlist::factory()->create(['user_id' => $user->id]);
    $screen = Screen::factory()->create([
        'created_by' => $user->id,
        'current_playlist_id' => $playlist->id,
    ]);

    $response = $this->postJson("/api/screens/{$screen->pairing_code}/heartbeat")
        ->assertOk();

    $response->assertJsonPath('playlist_id', $playlist->id);
});

test('heartbeat response has null playlist when none assigned', function () {
    $user = User::factory()->create();
    $screen = Screen::factory()->create([
        'created_by' => $user->id,
        'current_playlist_id' => null,
    ]);

    $this->postJson("/api/screens/{$screen->pairing_code}/heartbeat")
        ->assertOk()
        ->assertJsonPath('playlist_id', null);
});
