<?php

use App\Events\ScreenRefreshRequested;
use App\Models\Media;
use App\Models\Playlist;
use App\Models\PlaylistItem;
use App\Models\Screen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

test('unauthenticated user is redirected from playlists index', function () {
    $this->get('/playlists')->assertRedirect('/login');
});

test('admin can list playlists', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Playlist::factory()->count(3)->create(['user_id' => $admin->id]);

    $this->actingAs($admin)
        ->get('/playlists')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('playlists/index')
            ->has('playlists', 3)
        );
});

test('admin can create a playlist', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/playlists', [
            'name' => 'Welcome Loop',
            'description' => 'Main lobby content',
            'is_looping' => true,
            'default_image_duration' => 10,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('playlists', [
        'name' => 'Welcome Loop',
        'user_id' => $admin->id,
        'is_looping' => true,
        'default_image_duration' => 10,
    ]);
});

test('viewer cannot create a playlist', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->post('/playlists', ['name' => 'Test', 'default_image_duration' => 10])
        ->assertForbidden();
});

test('admin can view playlist detail with items', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);

    $this->actingAs($admin)
        ->get("/playlists/{$playlist->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('playlists/show')
            ->where('playlist.id', $playlist->id)
            ->has('availableMedia')
        );
});

test('admin can update playlist settings', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create([
        'user_id' => $admin->id,
        'name' => 'Old Name',
        'is_looping' => true,
    ]);

    $this->actingAs($admin)
        ->patch("/playlists/{$playlist->id}", [
            'name' => 'New Name',
            'is_looping' => false,
            'default_image_duration' => 15,
        ])
        ->assertRedirect();

    $playlist->refresh();
    expect($playlist->name)->toBe('New Name');
    expect($playlist->is_looping)->toBeFalse();
    expect($playlist->default_image_duration)->toBe(15);
});

test('admin can soft-delete their own playlist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);

    $this->actingAs($admin)
        ->delete("/playlists/{$playlist->id}")
        ->assertRedirect('/playlists');

    $this->assertSoftDeleted('playlists', ['id' => $playlist->id]);
});

test('admin cannot delete another admin\'s playlist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $other->id]);

    $this->actingAs($admin)
        ->delete("/playlists/{$playlist->id}")
        ->assertForbidden();
});

test('super_admin can delete any playlist', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $other = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $other->id]);

    $this->actingAs($superAdmin)
        ->delete("/playlists/{$playlist->id}")
        ->assertRedirect('/playlists');

    $this->assertSoftDeleted('playlists', ['id' => $playlist->id]);
});

test('admin can add media to a playlist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);
    $media = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);

    $this->actingAs($admin)
        ->post("/playlists/{$playlist->id}/items", [
            'media_id' => $media->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('playlist_items', [
        'playlist_id' => $playlist->id,
        'media_id' => $media->id,
    ]);
});

test('admin can remove media from a playlist', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);
    $media = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);
    $item = PlaylistItem::factory()->create([
        'playlist_id' => $playlist->id,
        'media_id' => $media->id,
    ]);

    $this->actingAs($admin)
        ->delete("/playlists/{$playlist->id}/items/{$item->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('playlist_items', ['id' => $item->id]);
});

test('adding media to a playlist notifies screens currently displaying it', function () {
    Event::fake([ScreenRefreshRequested::class]);

    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);
    $media = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);
    $screen = Screen::factory()->create(['current_playlist_id' => $playlist->id]);

    $this->actingAs($admin)
        ->post("/playlists/{$playlist->id}/items", ['media_id' => $media->id])
        ->assertRedirect();

    Event::assertDispatched(ScreenRefreshRequested::class, fn ($e) => $e->screen->id === $screen->id);
});

test('removing media from a playlist notifies screens currently displaying it', function () {
    Event::fake([ScreenRefreshRequested::class]);

    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);
    $media = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);
    $item = PlaylistItem::factory()->create(['playlist_id' => $playlist->id, 'media_id' => $media->id]);
    $screen = Screen::factory()->create(['current_playlist_id' => $playlist->id]);

    $this->actingAs($admin)
        ->delete("/playlists/{$playlist->id}/items/{$item->id}")
        ->assertRedirect();

    Event::assertDispatched(ScreenRefreshRequested::class, fn ($e) => $e->screen->id === $screen->id);
});

test('admin can reorder playlist items', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);
    $media1 = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);
    $media2 = Media::factory()->create(['user_id' => $admin->id, 'status' => 'ready']);

    $item1 = PlaylistItem::factory()->create(['playlist_id' => $playlist->id, 'media_id' => $media1->id, 'sort_order' => 0]);
    $item2 = PlaylistItem::factory()->create(['playlist_id' => $playlist->id, 'media_id' => $media2->id, 'sort_order' => 1]);

    $this->actingAs($admin)
        ->post("/playlists/{$playlist->id}/items/reorder", [
            'items' => [
                ['id' => $item1->id, 'sort_order' => 1],
                ['id' => $item2->id, 'sort_order' => 0],
            ],
        ])
        ->assertRedirect();

    expect($item1->fresh()->sort_order)->toBe(1);
    expect($item2->fresh()->sort_order)->toBe(0);
});
