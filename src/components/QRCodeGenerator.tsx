'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface QRCodeGeneratorProps {
    url: string;
    title?: string;
}

export default function QRCodeGenerator({ url, title }: QRCodeGeneratorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [dataUrl, setDataUrl] = useState<string>('');

    useEffect(() => {
        if (canvasRef.current) {
            QRCode.toCanvas(canvasRef.current, url, {
                width: 256,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });

            QRCode.toDataURL(url, {
                width: 512,
                margin: 2,
            }).then(setDataUrl);
        }
    }, [url]);

    const handleDownload = () => {
        if (!dataUrl) return;

        const link = document.createElement('a');
        link.download = `qrcode-${title || 'event'}.png`;
        link.href = dataUrl;
        link.click();
    };

    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                    <QrCode size={20} className="text-purple-400" />
                    QR Code Check-in
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg">
                    <canvas ref={canvasRef} />
                </div>
                <p className="text-sm text-zinc-400 text-center break-all max-w-xs">
                    {url}
                </p>
                <div className="flex gap-2">
                    <Button
                        onClick={() => navigator.clipboard.writeText(url)}
                        variant="outline"
                        className="border-zinc-700 text-zinc-300 gap-2"
                    >
                        <Copy size={18} />
                        Copy Link
                    </Button>
                    <Button onClick={handleDownload} className="bg-purple-600 hover:bg-purple-700 gap-2">
                        <Download size={18} />
                        Download PNG
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
