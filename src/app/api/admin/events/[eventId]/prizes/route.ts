import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Prize } from '@/models';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string }>;
}

// GET prizes for an event
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

        const prizes = await Prize.find({ eventId: event._id })
            .sort({ order: 1, createdAt: 1 })
            .lean();

        const formattedPrizes = prizes.map((p) => ({
            _id: p._id.toString(),
            eventId: p.eventId.toString(),
            name: p.name,
            quantityTotal: p.quantityTotal,
            quantityRemaining: p.quantityRemaining,
            order: p.order,
        }));

        return NextResponse.json({ success: true, data: formattedPrizes });
    } catch (error) {
        console.error('Get prizes error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch prizes' }, { status: 500 });
    }
}

// POST create new prize
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const body = await request.json();
        const { name, quantity, order = 0 } = body;

        if (!name || name.trim().length < 1) {
            return NextResponse.json({ success: false, error: 'Tên giải thưởng không được để trống' }, { status: 400 });
        }

        if (!quantity || quantity < 1) {
            return NextResponse.json({ success: false, error: 'Số lượng phải lớn hơn 0' }, { status: 400 });
        }

        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const prize = await Prize.create({
            eventId: event._id,
            name: name.trim(),
            quantityTotal: quantity,
            quantityRemaining: quantity,
            order,
        });

        return NextResponse.json({
            success: true,
            data: {
                _id: prize._id.toString(),
                eventId: prize.eventId.toString(),
                name: prize.name,
                quantityTotal: prize.quantityTotal,
                quantityRemaining: prize.quantityRemaining,
                order: prize.order,
            },
        });
    } catch (error) {
        console.error('Create prize error:', error);
        return NextResponse.json({ success: false, error: 'Failed to create prize' }, { status: 500 });
    }
}
