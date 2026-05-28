import { useForm } from '@inertiajs/react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function MediaUploader() {
    const { data, setData, post, processing, reset, progress } = useForm<{
        file: File | null;
        name: string;
    }>({
        file: null,
        name: '',
    });

    const [dragOver, setDragOver] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((file: File) => {
        const isVideo = file.type.startsWith('video/');
        const maxBytes = isVideo ? 500 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxBytes) {
            alert(`File too large. Maximum size is ${isVideo ? '500 MB for videos' : '50 MB for images'}.`);
            return;
        }
        setData('file', file);
        setData('name', file.name.replace(/\.[^.]+$/, ''));
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => { setPreview(e.target?.result as string); };
            reader.readAsDataURL(file);
        } else {
            setPreview(null);
        }
    }, [setData]);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) { handleFile(file); }
        },
        [handleFile],
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { handleFile(file); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.file) { return; }
        post('/media', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                setPreview(null);
            },
        });
    };

    const handleClear = () => {
        reset();
        setPreview(null);
        if (inputRef.current) { inputRef.current.value = ''; }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
                    dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                    data.file && 'border-primary',
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => { setDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => { inputRef.current?.click(); }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleChange}
                />

                {preview ? (
                    <img src={preview} alt="Preview" className="h-32 w-auto rounded object-contain" />
                ) : data.file ? (
                    <div className="text-center">
                        <ImagePlus className="text-muted-foreground mx-auto mb-2 h-10 w-10" />
                        <p className="text-sm font-medium">{data.file.name}</p>
                        <p className="text-muted-foreground text-xs">
                            {(data.file.size / 1024 / 1024).toFixed(1)} MB
                        </p>
                    </div>
                ) : (
                    <div className="text-center">
                        <Upload className="text-muted-foreground mx-auto mb-3 h-10 w-10" />
                        <p className="text-sm font-medium">Drag & drop or click to upload</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                            Images up to 50 MB &nbsp;·&nbsp; Videos (MP4, WebM, MOV) up to 500 MB
                        </p>
                    </div>
                )}
            </div>

            {data.file && (
                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={processing} className="flex-1 sm:flex-none">
                        {processing ? (
                            <>
                                <span className="mr-2">Uploading</span>
                                {progress && <span>{progress.percentage}%</span>}
                            </>
                        ) : (
                            'Upload Media'
                        )}
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={handleClear}>
                        <X className="h-4 w-4" />
                    </Button>
                    <span className="text-muted-foreground text-sm">{data.file.name}</span>
                </div>
            )}
        </form>
    );
}
