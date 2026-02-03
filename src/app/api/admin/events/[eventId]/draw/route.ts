import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Attendee, Prize, DrawRun, Winner } from '@/models';
import { auth } from '@/lib/auth';
import { secureRandomIndex } from '@/lib/crypto-random';
import type { ApiResponse, DrawResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string }>;
}

// POST execute a draw
export async function POST(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse<DrawResponse>>> {
    try {
        const authSession = await auth();
        if (!authSession) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const body = await request.json();
        const { prizeId } = body;

        if (!prizeId) {
            return NextResponse.json({ success: false, error: 'Prize ID is required' }, { status: 400 });
        }

        await dbConnect();

        // 1. Find event and verify it's live
        const event = await Event.findById(eventId);
        if (!event) {
            throw new Error('Event not found');
        }
        if (event.status !== 'live') {
            throw new Error('Sự kiện chưa mở hoặc đã kết thúc');
        }

        // 2. Find prize and check quantity
        const prize = await Prize.findById(prizeId);
        if (!prize) {
            throw new Error('Prize not found');
        }
        if (prize.eventId.toString() !== eventId) {
            throw new Error('Prize does not belong to this event');
        }
        if (prize.quantityRemaining <= 0) {
            throw new Error('Giải thưởng này đã hết');
        }

        // 3. Get eligible attendees (not won yet, not excluded from raffle)
        const eligibleAttendees = await Attendee.find({
            eventId: event._id,
            hasWon: false,
            $or: [
                { excludedFromRaffle: false },
                { excludedFromRaffle: { $exists: false } },
            ],
        }).lean();

        if (eligibleAttendees.length === 0) {
            throw new Error('Không còn người đủ điều kiện trúng thưởng');
        }

        // 4. Create draw run (outside of any transaction)
        const drawRun = await DrawRun.create([
            {
                eventId: event._id,
                prizeId: prize._id,
                createdBy: authSession.user?.email || 'admin',
            },
        ]);

        // 5. Select winner with small retry loop to handle rare duplicate conflicts
        const maxAttempts = Math.min(3, eligibleAttendees.length);
        let lastError: unknown = null;
        let winnerDoc: (typeof Winner)[];
        let selectedAttendee:
            | (typeof eligibleAttendees)[number]
            | null = null;

        const triedIds = new Set<string>();

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const remainingCandidates = eligibleAttendees.filter(
                (a) => !triedIds.has(a._id.toString())
            );

            if (remainingCandidates.length === 0) {
                break;
            }

            const winnerIndex = secureRandomIndex(remainingCandidates.length);
            selectedAttendee = remainingCandidates[winnerIndex];
            triedIds.add(selectedAttendee._id.toString());

            try {
                winnerDoc = await Winner.create([
                    {
                        eventId: event._id,
                        prizeId: prize._id,
                        drawRunId: drawRun[0]._id,
                        attendeeId: selectedAttendee._id,
                        snapshot: {
                            fullName: selectedAttendee.fullName,
                            department: selectedAttendee.department,
                            ticketNumber: selectedAttendee.ticketNumber,
                        },
                        wonAt: new Date(),
                    },
                ]);

                // If we reach here, Winner was created successfully; update attendee + prize
                await Attendee.findByIdAndUpdate(selectedAttendee._id, {
                    hasWon: true,
                });

                await Prize.findByIdAndUpdate(prize._id, {
                    $inc: { quantityRemaining: -1 },
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        winner: {
                            _id: winnerDoc[0]._id.toString(),
                            eventId: winnerDoc[0].eventId.toString(),
                            prizeId: winnerDoc[0].prizeId.toString(),
                            attendeeId: winnerDoc[0].attendeeId.toString(),
                            snapshot: winnerDoc[0].snapshot,
                            wonAt: winnerDoc[0].wonAt,
                            prizeName: prize.name,
                        },
                        prizeRemaining: prize.quantityRemaining - 1,
                    },
                });
            } catch (err) {
                lastError = err;
                // If duplicate winner (unique index on eventId+attendeeId), try another attendee
                if ((err as { code?: number }).code === 11000) {
                    continue;
                }

                // Other errors: stop retrying
                break;
            }
        }

        // If we exhausted attempts or hit a non-duplicate error
        if (lastError) {
            throw lastError;
        }

        throw new Error('Không còn người đủ điều kiện trúng thưởng');

    } catch (error) {
        console.error('Draw error:', error);

        const mongoError = error as { code?: number };
        const message = error instanceof Error ? error.message : 'Draw failed';

        // Handle duplicate key error (someone already won)
        if (mongoError.code === 11000) {
            return NextResponse.json(
                { success: false, error: 'Người này đã trúng thưởng trước đó' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: message },
            { status: 500 }
        );
    }
}

// PATCH update selected prize for next draw (admin only)
export async function PATCH(
    request: NextRequest,
    { params }: RouteParams
): Promise<NextResponse<ApiResponse>> {
    try {
        const authSession = await auth();
        if (!authSession) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { eventId } = await params;
        const body = await request.json();
        const { prizeId } = body;

        await dbConnect();

        const event = await Event.findById(eventId);
        if (!event) {
            return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
        }

        const update: { currentDrawPrizeId?: string | null } = {};
        if (prizeId === null || prizeId === '') {
            update.currentDrawPrizeId = null;
        } else if (prizeId) {
            const prize = await Prize.findById(prizeId);
            if (!prize || prize.eventId.toString() !== eventId) {
                return NextResponse.json({ success: false, error: 'Invalid prize' }, { status: 400 });
            }
            update.currentDrawPrizeId = prize._id;
        }

        await Event.findByIdAndUpdate(eventId, update);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('PATCH draw selection error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update selection' }, { status: 500 });
    }
}

// GET draw history + current selected prize - public for viewing winners
export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const { eventId } = await params;
        const { searchParams } = new URL(request.url);
        const prizeId = searchParams.get('prizeId');

        await dbConnect();

        const query: { eventId: string; prizeId?: string } = { eventId };
        if (prizeId) {
            query.prizeId = prizeId;
        }

        const [winners, event] = await Promise.all([
            Winner.find(query)
                .sort({ wonAt: -1 })
                .populate('prizeId', 'name')
                .lean(),
            Event.findById(eventId).populate<{ currentDrawPrizeId: { _id: unknown; name: string } }>('currentDrawPrizeId', '_id name').lean(),
        ]);

        const formattedWinners = winners.map((w) => ({
            _id: w._id.toString(),
            eventId: w.eventId.toString(),
            prizeId: w.prizeId.toString(),
            prizeName: (w.prizeId as unknown as { name: string }).name,
            attendeeId: w.attendeeId.toString(),
            snapshot: w.snapshot,
            wonAt: w.wonAt,
        }));

        const currentPrize = event?.currentDrawPrizeId;
        const selectedPrizeId = currentPrize ? (currentPrize as { _id: unknown })._id?.toString() : null;
        const selectedPrizeName = currentPrize && typeof currentPrize === 'object' && 'name' in currentPrize
            ? (currentPrize as { name: string }).name
            : null;

        return NextResponse.json({
            success: true,
            data: formattedWinners,
            selectedPrizeId: selectedPrizeId ?? null,
            selectedPrizeName: selectedPrizeName ?? null,
        });
    } catch (error) {
        console.error('Get history error:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch history' }, { status: 500 });
    }
}
