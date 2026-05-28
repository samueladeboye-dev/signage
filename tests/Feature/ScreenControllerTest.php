<?php

use App\Models\Playlist;
use App\Models\Screen;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('unauthenticated user is redirected from screens index', function () {
    $this->get('/screens')->assertRedirect('/login');
});

test('admin can list screens', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    Screen::factory()->count(3)->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->get('/screens')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('screens/index')
            ->has('screens', 3)
        );
});

test('viewer can list screens', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->get('/screens')
        ->assertOk();
});

test('admin can create a screen with a unique pairing code', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->post('/screens', [
            'name' => 'Lobby Screen',
            'location' => 'Main Lobby',
            'description' => 'Facing the entrance',
            'timezone' => 'UTC',
        ]);

    $response->assertRedirect();

    $screen = Screen::where('name', 'Lobby Screen')->first();
    expect($screen)->not->toBeNull();
    expect($screen->pairing_code)->toHaveLength(8);
    expect($screen->created_by)->toBe($admin->id);
});

test('viewer cannot register a screen', function () {
    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->post('/screens', ['name' => 'Test Screen', 'timezone' => 'UTC'])
        ->assertForbidden();
});

test('admin can view screen detail', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $screen = Screen::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->get("/screens/{$screen->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('screens/show')
            ->where('screen.id', $screen->id)
        );
});

test('admin can assign a playlist to a screen', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $screen = Screen::factory()->create(['created_by' => $admin->id]);
    $playlist = Playlist::factory()->create(['user_id' => $admin->id]);

    $this->actingAs($admin)
        ->patch("/screens/{$screen->id}", [
            'name' => $screen->name,
            'timezone' => $screen->timezone,
            'current_playlist_id' => $playlist->id,
        ])
        ->assertRedirect();

    expect($screen->fresh()->current_playlist_id)->toBe($playlist->id);
});

test('admin can soft-delete their own screen', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $screen = Screen::factory()->create(['created_by' => $admin->id]);

    $this->actingAs($admin)
        ->delete("/screens/{$screen->id}")
        ->assertRedirect('/screens');

    $this->assertSoftDeleted('screens', ['id' => $screen->id]);
});

test('admin cannot delete another admin\'s screen', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'admin']);
    $screen = Screen::factory()->create(['created_by' => $other->id]);

    $this->actingAs($admin)
        ->delete("/screens/{$screen->id}")
        ->assertForbidden();
});

test('super_admin can delete any screen', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $other = User::factory()->create(['role' => 'admin']);
    $screen = Screen::factory()->create(['created_by' => $other->id]);

    $this->actingAs($superAdmin)
        ->delete("/screens/{$screen->id}")
        ->assertRedirect('/screens');

    $this->assertSoftDeleted('screens', ['id' => $screen->id]);
});

test('pairing codes are unique across all screens', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    // Create 5 screens and verify all pairing codes are unique
    for ($i = 0; $i < 5; $i++) {
        $this->actingAs($admin)->post('/screens', [
            'name' => "Screen {$i}",
            'timezone' => 'UTC',
        ]);
    }

    $codes = Screen::pluck('pairing_code');
    expect($codes->count())->toBe($codes->unique()->count());
});
