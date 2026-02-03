import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Attendee, Prize, Winner } from '@/models';
import { auth } from '@/lib/auth';
import { generateEventCode } from '@/lib/crypto-random';
import type { ApiResponse } from '@/types';

// GET all events
export async function GET(): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const events = await Event.find().sort({ createdAt: -1 });

        // Get stats for each event
        const eventsWithStats = await Promise.all(
            events.map(async (event) => {
                const [attendeeCount, prizeCount, winnerCount] = await Promise.all([
                    Attendee.countDocuments({ eventId: event._id }),
                    Prize.countDocuments({ eventId: event._id }),
                    Winner.countDocuments({ eventId: event._id }),
                ]);

                return {
                    _id: event._id.toString(),
                    code: event.code,
                    name: event.name,
                    status: event.status,
                    createdAt: event.createdAt,
                    updatedAt: event.updatedAt,
                    stats: {
                        attendees: attendeeCount,
                        prizes: prizeCount,
                        winners: winnerCount,
                    },
                };
            })
        );

        return NextResponse.json({ success: true, data: eventsWithStats });
    } catch (error) {
        console.error('Get events error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch events' },
            { status: 500 }
        );
    }
}

// POST create new event
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, code } = body;

        if (!name || name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Tên sự kiện phải có ít nhất 2 ký tự' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Generate code if not provided
        const eventCode = code?.trim().toLowerCase() || generateEventCode(8);

        // Check if code exists
        const existing = await Event.findOne({ code: eventCode });
        if (existing) {
            return NextResponse.json(
                { success: false, error: 'Mã sự kiện đã tồn tại' },
                { status: 409 }
            );
        }

        const event = await Event.create({
            code: eventCode,
            name: name.trim(),
            status: 'draft',
        });

        return NextResponse.json({
            success: true,
            data: {
                _id: event._id.toString(),
                code: event.code,
                name: event.name,
                status: event.status,
                createdAt: event.createdAt,
            },
        });
    } catch (error) {
        console.error('Create event error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create event' },
            { status: 500 }
        );
    }
}
