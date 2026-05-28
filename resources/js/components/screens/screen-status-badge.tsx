import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { ScreenStatus } from '@/types';

type Props = {
    status: ScreenStatus;
};

export function ScreenStatusBadge({ status }: Props) {
    const isOnline = status === 'online';

    return (
        <Badge
            variant={isOnline ? 'default' : 'secondary'}
            className={
                isOnline
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'text-muted-foreground'
            }
        >
            {isOnline ? (
                <>
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                    <Wifi className="mr-1 h-3 w-3" />
                    Online
                </>
            ) : (
                <>
                    <WifiOff className="mr-1 h-3 w-3" />
                    Offline
                </>
            )}
        </Badge>
    );
}
