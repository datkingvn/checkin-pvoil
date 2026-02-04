import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Event, Attendee } from '@/models';
import { createNormalizedKey, isValidString, normalizePhoneNumber, isValidVietnamPhone } from '@/lib/helpers';
import type { ApiResponse, AttendeeData, CheckinResponse } from '@/types';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW_MS = 5000; // 5 seconds
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    rateLimitMap.forEach((timestamp, key) => {
        if (now - timestamp > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.delete(key);
        }
    });
}, 60000);

// Prevent memory leak in development
if (typeof window === 'undefined') {
    process.on('beforeExit', () => clearInterval(cleanupInterval));
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<CheckinResponse>>> {
    try {
        // Rate limiting by IP
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';

        const lastRequest = rateLimitMap.get(ip);
        const now = Date.now();

        if (lastRequest && now - lastRequest < RATE_LIMIT_WINDOW_MS) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng đợi vài giây trước khi thử lại' },
                { status: 429 }
            );
        }
        rateLimitMap.set(ip, now);

        // Parse and validate input
        const body = await request.json();
        const { eventCode, fullName, department, phoneNumber } = body;

        if (!isValidString(eventCode)) {
            return NextResponse.json(
                { success: false, error: 'Mã sự kiện không hợp lệ' },
                { status: 400 }
            );
        }

        if (!isValidString(fullName) || fullName.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập họ tên đầy đủ (ít nhất 2 ký tự)' },
                { status: 400 }
            );
        }

        if (!isValidString(department) || department.trim().length < 1) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập phòng ban' },
                { status: 400 }
            );
        }

        if (!isValidString(phoneNumber)) {
            return NextResponse.json(
                { success: false, error: 'Vui lòng nhập số điện thoại' },
                { status: 400 }
            );
        }

        if (!isValidVietnamPhone(phoneNumber)) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại không hợp lệ. Vui lòng nhập số 10 chữ số (ví dụ: 0912345678)' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find event
        const event = await Event.findOne({ code: eventCode.toLowerCase().trim() });

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy sự kiện' },
                { status: 404 }
            );
        }

        if (event.status !== 'live') {
            return NextResponse.json(
                { success: false, error: 'Sự kiện này chưa mở hoặc đã kết thúc check-in' },
                { status: 400 }
            );
        }

        const trimmedName = fullName.trim();
        const trimmedDept = department.trim();
        const trimmedPhone = phoneNumber.trim();
        const normalizedKey = createNormalizedKey(trimmedName, trimmedDept);
        const normalizedPhone = normalizePhoneNumber(trimmedPhone);

        // Check for duplicate by phone number
        const existingByPhone = await Attendee.findOne({
            eventId: event._id,
            normalizedPhone,
        });

        if (existingByPhone) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại này đã check-in rồi' },
                { status: 409 }
            );
        }

        // Get next ticket number
        const lastAttendee = await Attendee.findOne({ eventId: event._id })
            .sort({ ticketNumber: -1 })
            .select('ticketNumber');

        const ticketNumber = (lastAttendee?.ticketNumber || 0) + 1;

        // Create attendee
        const attendee = await Attendee.create({
            eventId: event._id,
            fullName: trimmedName,
            department: trimmedDept,
            ticketNumber,
            normalizedKey,
            phoneNumber: trimmedPhone,
            normalizedPhone,
            checkedInAt: new Date(),
            hasWon: false,
        });

        return NextResponse.json({
            success: true,
            data: {
                attendeeId: attendee._id.toString(),
                ticketNumber: attendee.ticketNumber,
                fullName: attendee.fullName,
                department: attendee.department,
                phoneNumber: attendee.phoneNumber,
                checkedInAt: attendee.checkedInAt,
            },
        });
    } catch (error) {
        console.error('Check-in error:', error);

        // Handle duplicate key error
        if ((error as { code?: number }).code === 11000) {
            return NextResponse.json(
                { success: false, error: 'Số điện thoại này đã check-in rồi' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Đã xảy ra lỗi. Vui lòng thử lại.' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AttendeeData[]>>> {
    try {
        const { searchParams } = new URL(request.url);
        const eventCode = searchParams.get('eventCode');

        if (!eventCode || !isValidString(eventCode)) {
            return NextResponse.json(
                { success: false, error: 'Mã sự kiện không hợp lệ' },
                { status: 400 }
            );
        }

        await dbConnect();

        const event = await Event.findOne({ code: eventCode.toLowerCase().trim() });

        if (!event) {
            return NextResponse.json(
                { success: false, error: 'Không tìm thấy sự kiện' },
                { status: 404 }
            );
        }

        const attendees = await Attendee.find({ eventId: event._id })
            .sort({ ticketNumber: -1 })
            .lean();

        const mapped: AttendeeData[] = attendees.map((a) => ({
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
            data: mapped,
        });
    } catch (error) {
        console.error('Get attendees error:', error);
        return NextResponse.json(
            { success: false, error: 'Không thể tải danh sách tham dự' },
            { status: 500 }
        );
    }
}
