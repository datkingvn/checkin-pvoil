import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Prize, Winner } from '@/models';
import { auth } from '@/lib/auth';
import type { ApiResponse } from '@/types';

interface RouteParams {
    params: Promise<{ eventId: string; prizeId: string }>;
}

// PATCH update prize
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { prizeId } = await params;
        const body = await request.json();
        const { name, quantity, order } = body;

        await dbConnect();

        const prize = await Prize.findById(prizeId);
        if (!prize) {
            return NextResponse.json({ success: false, error: 'Prize not found' }, { status: 404 });
        }

        if (name) prize.name = name.trim();
        if (typeof order === 'number') prize.order = order;

        if (typeof quantity === 'number' && quantity >= 1) {
            const usedQuantity = prize.quantityTotal - prize.quantityRemaining;
            if (quantity < usedQuantity) {
                return NextResponse.json(
                    { success: false, error: `Số lượng không thể nhỏ hơn ${usedQuantity} (đã phát)` },
                    { status: 400 }
                );
            }
            prize.quantityTotal = quantity;
            prize.quantityRemaining = quantity - usedQuantity;
        }

        await prize.save();

        return NextResponse.json({
            success: true,
            data: {
                _id: prize._id.toString(),
                name: prize.name,
                quantityTotal: prize.quantityTotal,
                quantityRemaining: prize.quantityRemaining,
                order: prize.order,
            },
        });
    } catch (error) {
        console.error('Update prize error:', error);
        return NextResponse.json({ success: false, error: 'Failed to update prize' }, { status: 500 });
    }
}

// DELETE prize
export async function DELETE(request: NextRequest, { params }: RouteParams): Promise<NextResponse<ApiResponse>> {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { prizeId } = await params;
        await dbConnect();

        const prize = await Prize.findById(prizeId);
        if (!prize) {
            return NextResponse.json({ success: false, error: 'Prize not found' }, { status: 404 });
        }

        // Check if prize has winners
        const winnerCount = await Winner.countDocuments({ prizeId: prize._id });
        if (winnerCount > 0) {
            return NextResponse.json(
                { success: false, error: 'Không thể xóa giải đã có người trúng' },
                { status: 400 }
            );
        }

        await Prize.findByIdAndDelete(prizeId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete prize error:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete prize' }, { status: 500 });
    }
}
