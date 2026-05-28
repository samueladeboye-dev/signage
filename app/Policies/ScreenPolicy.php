<?php

namespace App\Policies;

use App\Models\Screen;
use App\Models\User;

class ScreenPolicy
{
    /**
     * All authenticated users can view screens (viewers are read-only).
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Screen $screen): bool
    {
        return true;
    }

    public function create(User $user): bool
    {
        return ! $user->isViewer();
    }

    public function update(User $user, Screen $screen): bool
    {
        return ! $user->isViewer();
    }

    public function delete(User $user, Screen $screen): bool
    {
        return $user->isSuperAdmin() || ($user->isAdmin() && $screen->created_by === $user->id);
    }

    public function restore(User $user, Screen $screen): bool
    {
        return $user->isSuperAdmin();
    }

    public function forceDelete(User $user, Screen $screen): bool
    {
        return $user->isSuperAdmin();
    }
}
