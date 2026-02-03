'use client';

import { Loader2 } from 'lucide-react';

interface AdminLoaderProps {
    text?: string;
}

export default function AdminLoader({ text }: AdminLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
            {text && <p className="text-sm text-zinc-400">{text}</p>}
        </div>
    );
}
