import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Winner, Attendee, Prize } from '@/models';
import type { ApiResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string }>;
}

export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<null>>> {
    try {
        // Auth check removed for Kiosk/Public usage
        // const session = await auth();
        // if (!session || (session.user as { role?: string }).role !== 'admin') { ... }

        const { eventId } = await params;
        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Event not found' },
                { status: 404 }
            );
        }

        // 1. Delete all winners for this event
        await Winner.deleteMany({ eventId });

        // 2. Reset hasWon for all attendees
        await Attendee.updateMany(
            { eventId },
            { $set: { hasWon: false } }
        );

        // 3. Reset prize quantities
        // We find all prizes for this event and reset quantityRemaining = quantityTotal
        const prizes = await Prize.find({ eventId });
        await Promise.all(
            prizes.map((prize) => {
                prize.quantityRemaining = prize.quantityTotal;
                return prize.save();
            })
        );

        return NextResponse.json({
            success: true,
            data: null,
            message: 'Đã reset toàn bộ dữ liệu quay thưởng',
        });
    } catch (error) {
        console.error('Reset event error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to reset event' },
            { status: 500 }
        );
    }
}
