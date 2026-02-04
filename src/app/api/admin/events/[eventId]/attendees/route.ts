import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Attendee } from '@/models';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string }>;
}

// GET attendees for an event
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        // Auth check removed for public access
        
        const { eventId } = await params;
        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const attendees = await Attendee.find({ eventId: event._id })
            .sort({ ticketNumber: -1 })
            .lean();

        const formattedAttendees = attendees.map((a) => ({
            _id: a._id.toString(),
            fullName: a.fullName,
            department: a.department,
            ticketNumber: a.ticketNumber,
            checkedInAt: a.checkedInAt,
            hasWon: a.hasWon,
            excludedFromRaffle: a.excludedFromRaffle ?? false,
            phoneNumber: a.phoneNumber,
        }));

        return NextResponse.json({
            success: true,
            data: formattedAttendees,
        });
    } catch (error) {
        console.error('Get attendees error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch attendees' }, { status: 500 });
    }
}

// PATCH update attendee (e.g. excludedFromRaffle)
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const body = await request.json();
        const { attendeeId, excludedFromRaffle } = body;

        if (!attendeeId || typeof excludedFromRaffle !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'attendeeId and excludedFromRaffle (boolean) are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const attendee = await Attendee.findOne({ _id: attendeeId, eventId: event._id });
        if (!attendee) {
            return NextResponse.json({ success: false, error: 'Attendee not found' }, { status: 404 });
        }

        attendee.excludedFromRaffle = excludedFromRaffle;
        await attendee.save();

        return NextResponse.json({
            success: true,
            data: {
                _id: attendee._id.toString(),
                excludedFromRaffle: attendee.excludedFromRaffle,
            },
        });
    } catch (error) {
        console.error('Patch attendee error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update attendee' }, { status: 500 });
    }
}

// DELETE attendee from event
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const { searchParams } = new URL(request.url);
        const attendeeId = searchParams.get('attendeeId');

        if (!attendeeId) {
            return NextResponse.json(
                { success: false, error: 'attendeeId is required' },
                { status: 400 }
            );
        }

        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const attendee = await Attendee.findOne({ _id: attendeeId, eventId: event._id });
        if (!attendee) {
            return NextResponse.json({ success: false, error: 'Attendee not found' }, { status: 404 });
        }

        await Attendee.deleteOne({ _id: attendeeId, eventId: event._id });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete attendee error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete attendee' }, { status: 500 });
    }
}
