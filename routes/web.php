<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MediaController;
use App\Http\Controllers\PlaylistController;
use App\Http\Controllers\PlaylistItemController;
use App\Http\Controllers\PlayerController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\ScreenController;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard (or login if unauthenticated)
Route::redirect('/', '/dashboard')->name('home');

/*
|--------------------------------------------------------------------------
| Authenticated routes
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Screens
    Route::resource('screens', ScreenController::class)->except(['edit']);
    Route::post('screens/{screen}/refresh', [ScreenController::class, 'refresh'])->name('screens.refresh');

    // Media library
    Route::get('media', [MediaController::class, 'index'])->name('media.index');
    Route::post('media', [MediaController::class, 'store'])->name('media.store');
    Route::get('media/{media}', [MediaController::class, 'show'])->name('media.show');
    Route::delete('media/{media}', [MediaController::class, 'destroy'])->name('media.destroy');

    // Playlists
    Route::resource('playlists', PlaylistController::class)->except(['edit']);

    // Playlist items (nested under playlist)
    Route::post('playlists/{playlist}/items', [PlaylistItemController::class, 'store'])->name('playlist-items.store');
    Route::patch('playlists/{playlist}/items/{item}', [PlaylistItemController::class, 'update'])->name('playlist-items.update');
    Route::delete('playlists/{playlist}/items/{item}', [PlaylistItemController::class, 'destroy'])->name('playlist-items.destroy');
    Route::post('playlists/{playlist}/items/reorder', [PlaylistItemController::class, 'reorder'])->name('playlist-items.reorder');

    // Schedules
    Route::get('schedules', [ScheduleController::class, 'index'])->name('schedules.index');
    Route::post('schedules', [ScheduleController::class, 'store'])->name('schedules.store');
    Route::patch('schedules/{schedule}', [ScheduleController::class, 'update'])->name('schedules.update');
    Route::delete('schedules/{schedule}', [ScheduleController::class, 'destroy'])->name('schedules.destroy');
});

/*
|--------------------------------------------------------------------------
| Public routes (no auth)
|--------------------------------------------------------------------------
*/
Route::get('player/{pairingCode}', [PlayerController::class, 'show'])->name('player.show');

require __DIR__.'/settings.php';
