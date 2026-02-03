// Common API response types
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}

// Check-in types
export interface CheckinRequest {
    eventCode: string;
    fullName: string;
    department: string;
    phoneNumber: string;
}

export interface CheckinResponse {
    attendeeId: string;
    ticketNumber: number;
    fullName: string;
    department: string;
    phoneNumber?: string;
    checkedInAt: Date;
}

// Event types
export interface EventData {
    _id: string;
    code: string;
    name: string;
    status: 'draft' | 'live' | 'ended';
    createdAt: Date;
    updatedAt: Date;
}

export interface EventStats {
    totalAttendees: number;
    totalWinners: number;
    totalPrizes: number;
}

// Prize types
export interface PrizeData {
    _id: string;
    eventId: string;
    name: string;
    quantityTotal: number;
    quantityRemaining: number;
    order: number;
}

// Winner types
export interface WinnerData {
    _id: string;
    eventId: string;
    prizeId: string;
    attendeeId: string;
    snapshot: {
        fullName: string;
        department: string;
        ticketNumber: number;
    };
    wonAt: Date;
    prizeName?: string;
}

// Draw types
export interface DrawRequest {
    prizeId: string;
}

export interface DrawResponse {
    winner: WinnerData;
    prizeRemaining: number;
}

// Attendee types
export interface AttendeeData {
    _id: string;
    fullName: string;
    department: string;
    ticketNumber: number;
    checkedInAt: Date;
    hasWon: boolean;
    excludedFromRaffle?: boolean;
    phoneNumber?: string;
}
