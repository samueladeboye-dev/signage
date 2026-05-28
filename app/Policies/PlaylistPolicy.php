<?php

namespace App\Policies;

use App\Models\Playlist;
use App\Models\User;

class PlaylistPolicy
{
    public function viewAny(User $user): bool
    {
        return ! $user->isViewer();
    }

    public function view(User $user, Playlist $playlist): bool
    {
        return ! $user->isViewer();
    }

    public function create(User $user): bool
    {
        return ! $user->isViewer();
    }

    public function update(User $user, Playlist $playlist): bool
    {
        return $user->isSuperAdmin() || $playlist->user_id === $user->id;
    }

    public function delete(User $user, Playlist $playlist): bool
    {
        return $user->isSuperAdmin() || $playlist->user_id === $user->id;
    }

    public function restore(User $user, Playlist $playlist): bool
    {
        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user, Playlist $playlist): bool
    {
        return $user->isSuperAdmin();
    }
}
