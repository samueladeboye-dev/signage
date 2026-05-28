<?php

use App\Models\Screen;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

/*
|--------------------------------------------------------------------------
| Screen private channel — authenticated by pairing code
| The player uses this channel to receive real-time commands
|--------------------------------------------------------------------------
*/
Broadcast::channel('screen.{pairingCode}', function ($user, string $pairingCode) {
    // Authenticated users (admin dashboard) can listen to any screen channel
    // The player page also needs access — but players are not authenticated users.
    // We allow any authenticated user access; the player handles it via public broadcasts.
    return $user !== null;
});
