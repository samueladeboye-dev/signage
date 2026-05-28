<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return true; // All authenticated users can browse the media library
    }

    public function view(User $user, Media $media): bool
    {
        return true; // All authenticated users can view a media item
    }

    public function create(User $user): bool
    {
        return ! $user->isViewer();
    }

    public function update(User $user, Media $media): bool
    {
        return $user->isSuperAdmin() || $media->user_id === $user->id;
    }

    public function delete(User $user, Media $media): bool
    {
        return $user->isSuperAdmin() || $media->user_id === $user->id;
    }

    public function restore(User $user, Media $media): bool
    {
        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user, Media $media): bool
    {
        return $user->isSuperAdmin();
    }
}
