import { Head } from '@inertiajs/react';
import { Pause, Play, SkipBack, SkipForward, VolumeX } from 'lucide-react';
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

const HEARTBEAT_INTERVAL = 30_000;
const CACHE_KEY_PREFIX = 'signage_player_';
const CONTROLS_HIDE_DELAY = 3_000;

export default function PlayerShow({ screen, playlist: initialPlaylist }: Props) {
    const [playlist, setPlaylist] = useState<Playlist | null>(() => {
        try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${screen.pairing_code}`);
            if (cached) {
                const parsed = JSON.parse(cached) as { playlist: Playlist; ts: number };
                if (Date.now() - parsed.ts < 3600_000) { return parsed.playlist; }
            }
        } catch {
            // ignore cache errors
        }
        return initialPlaylist;
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showControls, setShowControls] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const transition = useCallback((getNextIndex: (prev: number) => number) => {
        setIsPaused(false);
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentIndex(getNextIndex);
            setIsTransitioning(false);
            setLoadError(false);
        }, 400);
    }, []);

    const advanceToNext = useCallback(() => {
        if (items.length === 0) { return; }
        transition((prev) => {
            const next = prev + 1;
            if (next >= items.length) { return playlist?.is_looping ? 0 : prev; }
            return next;
        });
    }, [items.length, playlist?.is_looping, transition]);

    const goToPrev = useCallback(() => {
        if (items.length === 0) { return; }
        transition((prev) => {
            if (prev === 0) { return playlist?.is_looping ? items.length - 1 : 0; }
            return prev - 1;
        });
    }, [items.length, playlist?.is_looping, transition]);

    const togglePause = useCallback(() => {
        setIsPaused((prev) => !prev);
    }, []);

    // Show controls and restart the hide timer
    const revealControls = useCallback(() => {
        setShowControls(true);
        if (controlsTimerRef.current) { clearTimeout(controlsTimerRef.current); }
        controlsTimerRef.current = setTimeout(() => { setShowControls(false); }, CONTROLS_HIDE_DELAY);
    }, []);

    // Start video playback with audio; fall back to muted if browser blocks it
    useEffect(() => {
        const video = videoRef.current;
        if (!video || currentItem?.media.type !== 'video') { return; }

        video.muted = false;
        video.play().catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
        });
    }, [currentIndex, currentItem?.media.type]);

    // Sync video pause/resume when isPaused changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || currentItem?.media.type !== 'video') { return; }

        if (isPaused) {
            video.pause();
        } else {
            video.play().catch(() => {});
        }
    }, [isPaused, currentItem?.media.type]);

    const handleUnmute = () => {
        const video = videoRef.current;
        if (!video) { return; }
        video.muted = false;
        setIsMuted(false);
    };

    // Schedule next slide for images (cancelled while paused)
    useEffect(() => {
        if (!currentItem || currentItem.media.type !== 'image' || isPaused) { return; }

        if (timerRef.current) { clearTimeout(timerRef.current); }

        timerRef.current = setTimeout(() => { advanceToNext(); }, currentItem.duration * 1000);

        return () => {
            if (timerRef.current) { clearTimeout(timerRef.current); }
        };
    }, [currentIndex, currentItem, advanceToNext, isPaused]);

    // Heartbeat ping
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                await fetch(`/api/screens/${screen.pairing_code}/heartbeat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                });
            } catch {
                // ignore
            }
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
        return () => { clearInterval(interval); };
    }, [screen.pairing_code]);

    // WebSocket — listen for playlist changes & refresh commands
    useEffect(() => {
        const setupEcho = async () => {
            try {
                const { default: Echo } = await import('@/echo');
                const channel = Echo.private(`screen.${screen.pairing_code}`);
                channel.listen('.playlist.assigned', () => { window.location.reload(); });
                channel.listen('.screen.refresh', () => { window.location.reload(); });
            } catch {
                // Echo not configured — silent fail
            }
        };
        setupEcho();
    }, [screen.pairing_code]);

    // Cleanup controls timer on unmount
    useEffect(() => () => {
        if (controlsTimerRef.current) { clearTimeout(controlsTimerRef.current); }
    }, []);

    const handleVideoEnded = () => { advanceToNext(); };
    const handleVideoError = () => {
        setLoadError(true);
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
                        <p className="mt-4 font-mono text-sm text-gray-600">Pairing code: {screen.pairing_code}</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title={screen.name} />
            <div
                className="relative h-screen w-screen overflow-hidden bg-black"
                onMouseMove={revealControls}
                onTouchStart={revealControls}
            >
                {/* Media */}
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
                                playsInline
                                onEnded={handleVideoEnded}
                                onError={handleVideoError}
                            />
                        )}
                    </div>
                )}

                {/* Unmute button — shown when browser forced muted autoplay */}
                {isMuted && currentItem?.media.type === 'video' && (
                    <button
                        onClick={handleUnmute}
                        className="absolute top-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm text-white backdrop-blur-sm hover:bg-black/80"
                    >
                        <VolumeX className="h-4 w-4" />
                        Tap to unmute
                    </button>
                )}

                {/* Error overlay */}
                {loadError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
                        <p className="text-sm text-gray-400">Media load error — advancing...</p>
                    </div>
                )}

                {/* Playback controls + progress dots — auto-hide after 3s */}
                <div
                    className={`absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 transition-opacity duration-300 ${
                        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                >
                    {/* Progress dots */}
                    {items.length > 1 && (
                        <div className="flex gap-1.5">
                            {items.map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                        i === currentIndex ? 'bg-white' : 'bg-white/40'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Control buttons */}
                    <div className="flex items-center gap-1 rounded-full bg-black/70 px-3 py-2 backdrop-blur-sm">
                        <button
                            onClick={goToPrev}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                            disabled={!playlist.is_looping && currentIndex === 0}
                        >
                            <SkipBack className="h-5 w-5" />
                        </button>

                        <button
                            onClick={togglePause}
                            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                        >
                            {isPaused
                                ? <Play className="h-6 w-6 translate-x-0.5" />
                                : <Pause className="h-6 w-6" />
                            }
                        </button>

                        <button
                            onClick={advanceToNext}
                            className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20 disabled:opacity-30"
                            disabled={!playlist.is_looping && currentIndex === items.length - 1}
                        >
                            <SkipForward className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

// No layout — fullscreen
PlayerShow.layout = null;
