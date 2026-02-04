import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import { Event, Attendee, Prize } from '@/models';
import { auth } from '@/lib/auth';
import RaffleClient from './RaffleClient';

interface RafflePageProps {
    params: Promise<{ eventCode: string }>;
}

export default async function RafflePage({ params }: RafflePageProps) {
    const { eventCode } = await params;

    await dbConnect();

    const event = await Event.findOne({ code: eventCode.toLowerCase() });

    if (!event) {
        notFound();
    }

    // Get session to check if user is admin
    const session = await auth();
    const isAdminFromSession = !!session;
    const isDefaultEvent = eventCode.toLowerCase() === 'default-event';
    const isAdmin = isDefaultEvent ? true : isAdminFromSession;

    // Get attendees and prizes
    const [attendees, prizes] = await Promise.all([
        Attendee.find({ eventId: event._id }).lean(),
        Prize.find({ eventId: event._id }).sort({ order: 1 }).lean(),
    ]);

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

    const formattedPrizes = prizes.map((p) => ({
        _id: p._id.toString(),
        eventId: p.eventId.toString(),
        name: p.name,
        quantityTotal: p.quantityTotal,
        quantityRemaining: p.quantityRemaining,
        order: p.order,
    }));

    return (
        <RaffleClient
            eventId={event._id.toString()}
            eventCode={event.code}
            eventName={event.name}
            initialAttendees={formattedAttendees}
            initialPrizes={formattedPrizes}
            isAdmin={isAdmin}
        />
    );
}

export async function generateMetadata({ params }: RafflePageProps) {
    const { eventCode } = await params;

    await dbConnect();
    const event = await Event.findOne({ code: eventCode.toLowerCase() });

    return {
        title: event ? `Quay thưởng - ${event.name}` : 'Quay thưởng',
        description: event ? `Vòng quay may mắn cho sự kiện ${event.name}` : 'Vòng quay may mắn',
    };
}
