import { router } from '@inertiajs/react';
import { CheckCircle, Film, Image, Loader2, Upload, X, XCircle } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type QueueItem = {
    id: string;
    file: File;
    status: 'pending' | 'uploading' | 'done' | 'error';
    progress: number;
    error?: string;
};

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime';

function validateFile(file: File): string | null {
    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    if (!isVideo && !isImage) return 'Unsupported file type.';
    const maxBytes = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxBytes) {
        return `Too large. Max ${isVideo ? '500 MB for videos' : '50 MB for images'}.`;
    }
    return null;
}

function formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaUploader() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((files: File[]) => {
        const items: QueueItem[] = files.map((file) => {
            const error = validateFile(file);
            return {
                id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
                file,
                status: error ? 'error' : 'pending',
                progress: 0,
                error: error ?? undefined,
            };
        });
        setQueue((prev) => [...prev, ...items]);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(Array.from(e.dataTransfer.files));
        },
        [addFiles],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            addFiles(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    const removeItem = (id: string) => {
        setQueue((prev) => prev.filter((q) => q.id !== id));
    };

    const clearCompleted = () => {
        setQueue((prev) => prev.filter((q) => q.status !== 'done'));
    };

    const uploadAll = async () => {
        const pending = queue.filter((q) => q.status === 'pending');
        if (!pending.length) return;

        setUploading(true);

        for (const item of pending) {
            await new Promise<void>((resolve) => {
                setQueue((prev) =>
                    prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q)),
                );

                router.post('/media', { file: item.file }, {
                    forceFormData: true,
                    preserveState: true,
                    preserveScroll: true,
                    onProgress: (progress) => {
                        setQueue((prev) =>
                            prev.map((q) =>
                                q.id === item.id ? { ...q, progress: progress.percentage ?? 0 } : q,
                            ),
                        );
                    },
                    onSuccess: () => {
                        setQueue((prev) =>
                            prev.map((q) =>
                                q.id === item.id ? { ...q, status: 'done', progress: 100 } : q,
                            ),
                        );
                        resolve();
                    },
                    onError: (errors) => {
                        const message = (Object.values(errors)[0] as string) ?? 'Upload failed.';
                        setQueue((prev) =>
                            prev.map((q) =>
                                q.id === item.id ? { ...q, status: 'error', error: message } : q,
                            ),
                        );
                        resolve();
                    },
                });
            });
        }

        setUploading(false);
        router.reload({ only: ['media'] });
    };

    const pendingCount = queue.filter((q) => q.status === 'pending').length;
    const doneCount = queue.filter((q) => q.status === 'done').length;

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
                    dragOver
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => { setDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => { inputRef.current?.click(); }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    className="hidden"
                    onChange={handleChange}
                />
                <Upload className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                <p className="text-sm font-medium">Drag & drop files or click to select</p>
                <p className="text-muted-foreground mt-1 text-xs">
                    Images up to 50 MB &nbsp;·&nbsp; Videos (MP4, WebM, MOV) up to 500 MB &nbsp;·&nbsp; Multiple files supported
                </p>
            </div>

            {queue.length > 0 && (
                <div className="space-y-2">
                    {queue.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                            <div className="text-muted-foreground shrink-0">
                                {item.file.type.startsWith('video/') ? (
                                    <Film className="h-4 w-4" />
                                ) : (
                                    <Image className="h-4 w-4" />
                                )}
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{item.file.name}</p>
                                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                                    <span>{formatSize(item.file.size)}</span>
                                    {item.status === 'error' && item.error && (
                                        <span className="text-destructive">{item.error}</span>
                                    )}
                                </div>
                                {item.status === 'uploading' && (
                                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="bg-primary h-full transition-all duration-300"
                                            style={{ width: `${item.progress}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="shrink-0">
                                {item.status === 'uploading' ? (
                                    <Loader2 className="text-primary h-4 w-4 animate-spin" />
                                ) : item.status === 'done' ? (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : item.status === 'error' ? (
                                    <XCircle className="text-destructive h-4 w-4" />
                                ) : (
                                    <button
                                        type="button"
                                        className="text-muted-foreground hover:text-foreground"
                                        onClick={() => { removeItem(item.id); }}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center gap-3 pt-1">
                        <Button
                            type="button"
                            disabled={uploading || pendingCount === 0}
                            onClick={uploadAll}
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Uploading...
                                </>
                            ) : (
                                `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`
                            )}
                        </Button>
                        {doneCount > 0 && (
                            <Button type="button" variant="ghost" onClick={clearCompleted}>
                                Clear completed
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
