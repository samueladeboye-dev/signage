<?php

namespace App\Events;

use App\Models\Screen;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ScreenStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public readonly Screen $screen) {}

    public function broadcastOn(): array
    {
        return [new Channel('screens')];
    }

    public function broadcastAs(): string
    {
        return 'screen.status.changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->screen->id,
            'name' => $this->screen->name,
            'status' => $this->screen->status,
            'last_seen_at' => $this->screen->last_seen_at?->toISOString(),
        ];
    }
}
