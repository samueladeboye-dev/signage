<?php

namespace App\Jobs;

use App\Events\ScreenStatusChanged;
use App\Models\Screen;
use App\Models\User;
use App\Notifications\ScreenOfflineNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class DetectOfflineScreensJob implements ShouldQueue
{
    use Queueable;

    public function handle(): void
    {
        // Mark screens offline if they haven't sent a heartbeat in 2 minutes
        $staleScreens = Screen::where('status', 'online')
            ->where('last_seen_at', '<', now()->subMinutes(2))
            ->get();

        foreach ($staleScreens as $screen) {
            $screen->markOffline();
            broadcast(new ScreenStatusChanged($screen));

            // Notify admins and super admins
            $admins = User::whereIn('role', ['super_admin', 'admin'])->get();
            foreach ($admins as $admin) {
                $admin->notify(new ScreenOfflineNotification($screen));
            }
        }
    }
}
