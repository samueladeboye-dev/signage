<?php

namespace App\Notifications;

use App\Models\Screen;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ScreenOfflineNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public readonly Screen $screen) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Screen Offline Alert — '.$this->screen->name)
            ->greeting('Screen Offline!')
            ->line("The screen **{$this->screen->name}** ({$this->screen->location}) has gone offline.")
            ->line('Last seen: '.($this->screen->last_seen_at?->diffForHumans() ?? 'Never'))
            ->action('View Screen', route('screens.show', $this->screen))
            ->line('Please check the device and ensure it is connected to the network.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'screen_id' => $this->screen->id,
            'screen_name' => $this->screen->name,
            'location' => $this->screen->location,
            'last_seen_at' => $this->screen->last_seen_at?->toISOString(),
        ];
    }
}
