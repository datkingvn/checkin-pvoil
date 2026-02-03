import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Attendee, Prize, Winner } from '@/models';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string }>;
}

// GET single event with stats
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const [attendeeCount, prizeCount, winnerCount] = await Promise.all([
            Attendee.countDocuments({ eventId: event._id }),
            Prize.countDocuments({ eventId: event._id }),
            Winner.countDocuments({ eventId: event._id }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
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
            },
        });
    } catch (error) {
        console.error('Get event error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch event' }, { status: 500 });
    }
}

// PATCH update event
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const body = await request.json();
        const { name, status } = body;

        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        if (name) event.name = name.trim();
        if (status && ['draft', 'live', 'ended'].includes(status)) {
            event.status = status;
        }

        await event.save();

        return NextResponse.json({
            success: true,
            data: {
                _id: event._id.toString(),
                code: event.code,
                name: event.name,
                status: event.status,
                updatedAt: event.updatedAt,
            },
        });
    } catch (error) {
        console.error('Update event error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update event' }, { status: 500 });
    }
}

// DELETE event
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        // Delete related data
        await Promise.all([
            Attendee.deleteMany({ eventId: event._id }),
            Prize.deleteMany({ eventId: event._id }),
            Winner.deleteMany({ eventId: event._id }),
            Event.findByIdAndDelete(eventId),
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete event error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
    }
}
