import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
    code: string;
};

export function PairingCodeDisplay({ code }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => { setCopied(false); }, 2000);
    };

    return (
        <div className="flex items-center gap-2">
            <code className="bg-muted rounded px-3 py-1.5 font-mono text-lg font-bold tracking-widest">
                {code}
            </code>
            <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy pairing code">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
    );
}
