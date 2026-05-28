<?php

use App\Http\Controllers\HeartbeatController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public API Routes (used by screen players — no auth required)
|--------------------------------------------------------------------------
*/

Route::post('screens/{pairingCode}/heartbeat', [HeartbeatController::class, 'store'])
    ->name('api.screens.heartbeat');
