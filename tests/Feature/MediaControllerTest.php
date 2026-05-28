<?php

use App\Jobs\ProcessMediaJob;
use App\Models\Media;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('unauthenticated user is redirected from media index', function () {
    $this->get('/media')->assertRedirect('/login');
});

test('admin can list media', function () {
    Storage::fake('s3');

    $admin = User::factory()->create(['role' => 'admin']);
    Media::factory()->count(4)->create(['user_id' => $admin->id]);

    $this->actingAs($admin)
        ->get('/media')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('media/index')
            ->has('media')
        );
});

test('viewer can view media library', function () {
    Storage::fake('s3');

    $viewer = User::factory()->create(['role' => 'viewer']);

    $this->actingAs($viewer)
        ->get('/media')
        ->assertOk();
});

test('admin can upload an image and it is stored on s3', function () {
    Storage::fake('s3');
    Queue::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $file = UploadedFile::fake()->image('banner.jpg', 1920, 1080);

    $this->actingAs($admin)
        ->post('/media', ['file' => $file])
        ->assertRedirect();

    $media = Media::where('original_name', 'banner.jpg')->first();
    expect($media)->not->toBeNull();
    expect($media->type)->toBe('image');
    expect($media->user_id)->toBe($admin->id);

    Storage::disk('s3')->assertExists($media->path);
    Queue::assertPushed(ProcessMediaJob::class);
});

test('admin can upload a video', function () {
    Storage::fake('s3');
    Queue::fake();

    $admin = User::factory()->create(['role' => 'admin']);
    $file = UploadedFile::fake()->create('promo.mp4', 5000, 'video/mp4');

    $this->actingAs($admin)
        ->post('/media', ['file' => $file])
        ->assertRedirect();

    $media = Media::where('original_name', 'promo.mp4')->first();
    expect($media)->not->toBeNull();
    expect($media->type)->toBe('video');

    Storage::disk('s3')->assertExists($media->path);
});

test('viewer cannot upload media', function () {
    Storage::fake('s3');

    $viewer = User::factory()->create(['role' => 'viewer']);
    $file = UploadedFile::fake()->image('test.jpg');

    $this->actingAs($viewer)
        ->post('/media', ['file' => $file])
        ->assertForbidden();
});

test('upload requires a file', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $this->actingAs($admin)
        ->post('/media', [])
        ->assertSessionHasErrors('file');
});

test('admin can soft-delete their own media and s3 file is removed', function () {
    Storage::fake('s3');

    $admin = User::factory()->create(['role' => 'admin']);
    Storage::disk('s3')->put('media/test.jpg', 'fake-content');

    $media = Media::factory()->create([
        'user_id' => $admin->id,
        'disk' => 's3',
        'path' => 'media/test.jpg',
    ]);

    $this->actingAs($admin)
        ->delete("/media/{$media->id}")
        ->assertRedirect('/media');

    $this->assertSoftDeleted('media', ['id' => $media->id]);
    Storage::disk('s3')->assertMissing('media/test.jpg');
});

test('admin cannot delete another admin\'s media', function () {
    Storage::fake('s3');

    $admin = User::factory()->create(['role' => 'admin']);
    $other = User::factory()->create(['role' => 'admin']);
    $media = Media::factory()->create(['user_id' => $other->id]);

    $this->actingAs($admin)
        ->delete("/media/{$media->id}")
        ->assertForbidden();
});

test('super_admin can delete any media', function () {
    Storage::fake('s3');

    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $other = User::factory()->create(['role' => 'admin']);
    Storage::disk('s3')->put('media/other.jpg', 'fake-content');

    $media = Media::factory()->create([
        'user_id' => $other->id,
        'disk' => 's3',
        'path' => 'media/other.jpg',
    ]);

    $this->actingAs($superAdmin)
        ->delete("/media/{$media->id}")
        ->assertRedirect('/media');

    $this->assertSoftDeleted('media', ['id' => $media->id]);
});
