import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';

type MediaItem = {
    id: number;
    sort_order: number;
    duration: number;
    media: {
        id: number;
        name: string;
        type: 'image' | 'video';
        url: string;
        mime_type: string;
        duration: number | null;
    };
};

type Playlist = {
    id: number;
    name: string;
    is_looping: boolean;
    default_image_duration: number;
    items: MediaItem[];
};

type ScreenInfo = {
    id: number;
    name: string;
    pairing_code: string;
    timezone: string;
};

type Props = {
    screen: ScreenInfo;
    playlist: Playlist | null;
};

const HEARTBEAT_INTERVAL = 30_000; // 30 seconds
const CACHE_KEY_PREFIX = 'signage_player_';

/**
 * Fullscreen digital signage player.
 * Renders at /player/{pairing_code} — no auth required, no layout wrapper.
 */
export default function PlayerShow({ screen, playlist: initialPlaylist }: Props) {
    const [playlist, setPlaylist] = useState<Playlist | null>(() => {
        // Restore from localStorage cache on first load
        try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${screen.pairing_code}`);
            if (cached) {
                const parsed = JSON.parse(cached) as { playlist: Playlist; ts: number };
                // Cache valid for 1 hour
                if (Date.now() - parsed.ts < 3600_000) {
                    return parsed.playlist;
                }
            }
        } catch {
            // ignore cache errors
        }
        return initialPlaylist;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Persist playlist to cache whenever it changes
    useEffect(() => {
        if (playlist) {
            try {
                localStorage.setItem(
                    `${CACHE_KEY_PREFIX}${screen.pairing_code}`,
                    JSON.stringify({ playlist, ts: Date.now() }),
                );
            } catch {
                // storage full or unavailable
            }
        }
    }, [playlist, screen.pairing_code]);

    const items = playlist?.items ?? [];
    const currentItem = items[currentIndex] ?? null;

    const advanceToNext = useCallback(() => {
        if (items.length === 0) { return; }

        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex((prev) => {
                const next = prev + 1;
                if (next >= items.length) {
                    return playlist?.is_looping ? 0 : prev;
                }
                return next;
            });
            setIsTransitioning(false);
            setLoadError(false);
        }, 400);
    }, [items.length, playlist?.is_looping]);

    // Schedule next slide for images
    useEffect(() => {
        if (!currentItem || currentItem.media.type !== 'image') { return; }

        if (timerRef.current) { clearTimeout(timerRef.current); }

        timerRef.current = setTimeout(() => {
            advanceToNext();
        }, currentItem.duration * 1000);

        return () => {
            if (timerRef.current) { clearTimeout(timerRef.current); }
        };
    }, [currentIndex, currentItem, advanceToNext]);

    // Heartbeat ping
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await fetch(`/api/screens/${screen.pairing_code}/heartbeat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });
            } catch {
                // network error — ignore, auto-reconnect
            }
        };

        // Send immediately on mount
        sendHeartbeat();

        const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
        return () => { clearInterval(interval); };
    }, [screen.pairing_code]);

    // WebSocket via Laravel Echo — listen for playlist changes & refresh commands
    useEffect(() => {
        // Dynamically import Echo to avoid SSR issues
        const setupEcho = async () => {
            try {
                const { default: Echo } = await import('@/echo');
                const channel = Echo.private(`screen.${screen.pairing_code}`);

                channel.listen('.playlist.assigned', () => {
                    // Reload page to fetch new playlist
                    window.location.reload();
                });

                channel.listen('.screen.refresh', () => {
                    window.location.reload();
                });
            } catch {
                // Echo not configured — silent fail
            }
        };

        setupEcho();
    }, [screen.pairing_code]);

    const handleVideoEnded = () => {
        advanceToNext();
    };

    const handleVideoError = () => {
        setLoadError(true);
        // Advance after 3s on video error
        setTimeout(() => { advanceToNext(); }, 3000);
    };

    if (!playlist || items.length === 0) {
        return (
            <>
                <Head title={screen.name} />
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-black text-white">
                    <div className="text-center">
                        <h1 className="mb-2 text-2xl font-bold">{screen.name}</h1>
                        <p className="text-gray-400">No playlist assigned</p>
                        <p className="mt-4 font-mono text-sm text-gray-600">
                            Pairing code: {screen.pairing_code}
                        </p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={screen.name} />
            <div className="relative h-screen w-screen overflow-hidden bg-black">
                {currentItem && (
                    <div
                        className={`absolute inset-0 transition-opacity duration-400 ${
                            isTransitioning ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                        {currentItem.media.type === 'image' ? (
                            <img
                                key={currentItem.id}
                                src={currentItem.media.url}
                                alt={currentItem.media.name}
                                className="h-full w-full object-contain"
                                onError={() => { setLoadError(true); setTimeout(() => { advanceToNext(); }, 2000); }}
                            />
                        ) : (
                            <video
                                key={currentItem.id}
                                ref={videoRef}
                                src={currentItem.media.url}
                                className="h-full w-full object-contain"
                                autoPlay
                                muted
                                playsInline
                                onEnded={handleVideoEnded}
                                onError={handleVideoError}
                            />
                        )}
                    </div>
                )}

                {/* Error overlay */}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                        <p className="text-sm text-gray-400">Media load error — advancing...</p>
                    </div>
                )}

                {/* Progress dots */}
                {items.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                        {items.map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                    i === currentIndex ? 'bg-white' : 'bg-white/30'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

// No layout — fullscreen
PlayerShow.layout = null;
