import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { Media } from '@/types';

type Props = {
    media: Media;
    onClose: () => void;
};

export function MediaPreview({ media, onClose }: Props) {
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); }
        };
        document.addEventListener('keydown', handleKey);
        return () => { document.removeEventListener('keydown', handleKey); };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] max-w-5xl"
                onClick={(e) => { e.stopPropagation(); }}
            >
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-10 right-0 text-white hover:text-white"
                    onClick={onClose}
                >
                    <X className="h-5 w-5" />
                </Button>

                {media.type === 'image' ? (
                    <img
                        src={media.url ?? media.thumbnail_url ?? ''}
                        alt={media.name}
                        className="max-h-[80vh] w-auto rounded-lg object-contain"
                    />
                ) : (
                    <video
                        src={media.url ?? ''}
                        controls
                        autoPlay
                        className="max-h-[80vh] w-auto rounded-lg"
                    />
                )}

                <div className="mt-3 text-center text-white">
                    <p className="text-sm font-medium">{media.name}</p>
                    <p className="text-xs opacity-70">
                        {(media.size / 1024 / 1024).toFixed(1)} MB
                        {media.duration && ` · ${Math.round(media.duration)}s`}
                    </p>
                </div>
            </div>
        </div>
    );
}
