import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { Event } from '@/models';
import CheckinForm from '@/components/checkin/CheckinForm';

interface CheckinPageProps {
    params: Promise<{ eventCode: string }>;
}

export default async function CheckinPage({ params }: CheckinPageProps) {
    const { eventCode } = await params;

    await dbConnect();

    const event = await Event.findOne({ code: eventCode.toLowerCase() });

    if (!event) {
        notFound();
    }

    if (event.status !== 'live') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4">
                <div className="text-center text-white">
                    <h1 className="text-3xl font-bold mb-4">Sự kiện chưa mở</h1>
                    <p className="text-zinc-400">
                        {event.status === 'draft'
                            ? 'Sự kiện này chưa được mở check-in.'
                            : 'Sự kiện này đã kết thúc.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-purple-900/20 to-zinc-900 flex items-center justify-center p-4">
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 w-full max-w-md">
                <CheckinForm eventCode={event.code} eventName={event.name} />
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: CheckinPageProps) {
    const { eventCode } = await params;

    await dbConnect();
    const event = await Event.findOne({ code: eventCode.toLowerCase() });

    return {
        title: event ? `Check-in - ${event.name}` : 'Check-in',
        description: event ? `Check-in cho sự kiện ${event.name}` : 'Check-in sự kiện',
    };
}
