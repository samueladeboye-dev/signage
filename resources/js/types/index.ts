export type * from './auth';
export type * from './navigation';
export type * from './ui';

// ─── Roles ───────────────────────────────────────────────────────────────────
export type Role = 'super_admin' | 'admin' | 'viewer';

// ─── Orientation ─────────────────────────────────────────────────────────────
export type Orientation = 'landscape' | 'portrait';

// ─── Screens ─────────────────────────────────────────────────────────────────
export type ScreenStatus = 'online' | 'offline';

export type Screen = {
    id: number;
    name: string;
    location: string | null;
    description: string | null;
    pairing_code: string;
    orientation: Orientation;
    status: ScreenStatus;
    last_seen_at: string | null;
    last_seen_at_raw: string | null;
    timezone: string;
    current_playlist: { id: number; name: string } | null;
    schedules?: ScreenSchedule[];
    created_at: string;
};

// ─── Media ───────────────────────────────────────────────────────────────────
export type MediaType = 'image' | 'video';
export type MediaStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type Media = {
    id: number;
    name: string;
    type: MediaType;
    mime_type: string;
    size: number;
    duration: number | null;
    width: number | null;
    height: number | null;
    orientation: Orientation | null;
    status: MediaStatus;
    thumbnail_url: string | null;
    url: string | null;
    created_at: string;
};

// ─── Playlists ────────────────────────────────────────────────────────────────
export type PlaylistItem = {
    id: number;
    sort_order: number;
    duration: number | null;
    effective_duration: number;
    media: {
        id: number;
        name: string;
        type: MediaType;
        thumbnail_url: string | null;
        duration: number | null;
    };
};

export type Playlist = {
    id: number;
    name: string;
    description: string | null;
    is_looping: boolean;
    default_image_duration: number;
    items_count?: number;
    screens_count?: number;
    items?: PlaylistItem[];
    created_at: string;
};

// ─── Schedules ───────────────────────────────────────────────────────────────
export type ScreenSchedule = {
    id: number;
    screen?: { id: number; name: string; location: string | null };
    playlist: { id: number; name: string };
    starts_at: string | null;
    ends_at: string | null;
    is_active: boolean;
    created_at?: string;
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export type DashboardStats = {
    total_screens: number;
    online_screens: number;
    total_media: number;
    total_playlists: number;
};
