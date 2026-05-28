<?php

namespace App\Models;

use Database\Factories\PlaylistItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['playlist_id', 'media_id', 'sort_order', 'duration'])]
class PlaylistItem extends Model
{
    /** @use HasFactory<PlaylistItemFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'duration' => 'integer',
        ];
    }

    public function playlist(): BelongsTo
    {
        return $this->belongsTo(Playlist::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }

    /**
     * Effective display duration: item override or playlist default.
     */
    public function effectiveDuration(): int
    {
        if ($this->duration) {
            return $this->duration;
        }

        return $this->playlist?->default_image_duration ?? 10;
    }
}
