'use client';

import { useState, useCallback } from 'react';
import RaffleStage from '@/components/raffle/RaffleStage';
import type { AttendeeData, PrizeData } from '@/types';

interface RaffleClientProps {
    eventId: string;
    eventCode: string;
    eventName: string;
    initialAttendees: AttendeeData[];
    initialPrizes: PrizeData[];
    isAdmin: boolean;
}

export default function RaffleClient({
    eventId,
    eventCode,
    eventName,
    initialAttendees,
    initialPrizes,
    isAdmin,
}: RaffleClientProps) {
    const [attendees, setAttendees] = useState(initialAttendees);
    const [prizes, setPrizes] = useState(initialPrizes);

    const handleRefresh = useCallback(async () => {
        try {
            const [attendeesRes, prizesRes] = await Promise.all([
                fetch(`/api/admin/events/${eventId}/attendees`),
                fetch(`/api/admin/events/${eventId}/prizes`),
            ]);

            const [attendeesData, prizesData] = await Promise.all([
                attendeesRes.json(),
                prizesRes.json(),
            ]);

            if (attendeesData.success) {
                setAttendees(attendeesData.data);
            }
            if (prizesData.success) {
                setPrizes(prizesData.data);
            }
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    }, [eventId]);

    return (
        <RaffleStage
            eventId={eventId}
            eventName={eventName}
            prizes={prizes}
            attendees={attendees}
            isAdmin={isAdmin}
            onRefresh={handleRefresh}
        />
    );
}
