<?php

namespace App\Events;

use App\Models\Screen;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlaylistAssignedToScreen implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Screen $screen) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel('screen.'.$this->screen->pairing_code)];
    }

    public function broadcastAs(): string
    {
        return 'playlist.assigned';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'playlist_id' => $this->screen->current_playlist_id,
        ];
    }
}
