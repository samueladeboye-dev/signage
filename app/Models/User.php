<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'role' => \App\Enums\Role::class,
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === \App\Enums\Role::SuperAdmin;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, [\App\Enums\Role::SuperAdmin, \App\Enums\Role::Admin], true);
    }

    public function isViewer(): bool
    {
        return $this->role === \App\Enums\Role::Viewer;
    }

    public function screens(): HasMany
    {
        return $this->hasMany(Screen::class, 'created_by');
    }

    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    public function playlists(): HasMany
    {
        return $this->hasMany(Playlist::class);
    }
}
