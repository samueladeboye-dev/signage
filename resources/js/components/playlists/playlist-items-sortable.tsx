import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { router } from '@inertiajs/react';
import { Clock, Film, GripVertical, Image, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { PlaylistItem } from '@/types';

type Props = {
    playlistId: number;
    items: PlaylistItem[];
};

type SortableItemProps = {
    item: PlaylistItem;
    playlistId: number;
    onDurationChange: (id: number, duration: number | null) => void;
};

function SortableItem({ item, playlistId, onDurationChange }: SortableItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDelete = () => {
        if (confirm(`Remove "${item.media.name}" from this playlist?`)) {
            router.delete(`/playlists/${playlistId}/items/${item.id}`);
        }
    };

    const handleDurationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const duration = val ? parseInt(val, 10) : null;
        router.patch(
            `/playlists/${playlistId}/items/${item.id}`,
            { duration },
            { preserveScroll: true },
        );
        onDurationChange(item.id, duration);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-card flex items-center gap-3 rounded-lg border p-3"
        >
            {/* Drag handle */}
            <button
                className="text-muted-foreground cursor-grab touch-none active:cursor-grabbing"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>

            {/* Thumbnail */}
            <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-black/5">
                {item.media.thumbnail_url ? (
                    <img
                        src={item.media.thumbnail_url}
                        alt={item.media.name}
                        className="h-full w-full object-cover"
                    />
                ) : item.media.type === 'video' ? (
                    <div className="flex h-full items-center justify-center">
                        <Film className="text-muted-foreground h-4 w-4" />
                    </div>
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Image className="text-muted-foreground h-4 w-4" />
                    </div>
                )}
            </div>

            {/* Name + type */}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.media.name}</p>
                <p className="text-muted-foreground text-xs capitalize">
                    {item.media.type}
                    {item.media.duration && ` · ${Math.round(item.media.duration)}s`}
                </p>
            </div>

            {/* Duration override (images only) */}
            {item.media.type === 'image' && (
                <div className="flex items-center gap-1.5">
                    <Clock className="text-muted-foreground h-3.5 w-3.5" />
                    <Input
                        type="number"
                        min="1"
                        max="3600"
                        defaultValue={item.duration ?? ''}
                        placeholder={`${item.effective_duration}s`}
                        className="h-7 w-20 text-xs"
                        onBlur={handleDurationBlur}
                    />
                    <span className="text-muted-foreground text-xs">s</span>
                </div>
            )}

            {/* Delete */}
            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}

export function PlaylistItemsSortable({ playlistId, items: initialItems }: Props) {
    const [items, setItems] = useState(initialItems);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) { return; }

        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);

        setItems(reordered.map((item, index) => ({ ...item, sort_order: index })));

        router.post(
            `/playlists/${playlistId}/items/reorder`,
            {
                items: reordered.map((item, index) => ({ id: item.id, sort_order: index })),
            },
            { preserveScroll: true },
        );
    };

    const handleDurationChange = (id: number, duration: number | null) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, duration } : item)));
    };

    if (items.length === 0) {
        return (
            <div className="text-muted-foreground rounded-lg border border-dashed py-12 text-center text-sm">
                No media in this playlist. Add media from the library below.
            </div>
        );
    }

    return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                    {items.map((item) => (
                        <SortableItem
                            key={item.id}
                            item={item}
                            playlistId={playlistId}
                            onDurationChange={handleDurationChange}
                        />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}
