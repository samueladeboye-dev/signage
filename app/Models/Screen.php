<?php

namespace App\Models;

use Database\Factories\ScreenFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable(['created_by', 'pairing_code', 'name', 'location', 'description', 'timezone', 'current_playlist_id'])]
class Screen extends Model
{
    /** @use HasFactory<ScreenFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'last_seen_at' => 'datetime',
            'status' => \App\Enums\ScreenStatus::class,
        ];
    }

    public static function generatePairingCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (static::where('pairing_code', $code)->exists());

        return $code;
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function currentPlaylist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class, 'current_playlist_id');
    }

    public function schedules(): HasMany
    {
        return $this->hasMany(ScreenSchedule::class);
    }

    public function isOnline(): bool
    {
        return $this->status === \App\Enums\ScreenStatus::Online;
    }

    public function markOnline(): void
    {
        $this->status = \App\Enums\ScreenStatus::Online;
        $this->last_seen_at = now();
        $this->save();
    }

    public function markOffline(): void
    {
        $this->status = \App\Enums\ScreenStatus::Offline;
        $this->save();
    }
}
