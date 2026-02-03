import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendee extends Document {
    _id: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    fullName: string;
    department: string;
    ticketNumber: number;
    checkedInAt: Date;
    normalizedKey: string;
    hasWon: boolean;
    excludedFromRaffle?: boolean;
    phoneNumber?: string;
    normalizedPhone?: string;
}

const AttendeeSchema = new Schema<IAttendee>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
            index: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        department: {
            type: String,
            required: true,
            trim: true,
        },
        ticketNumber: {
            type: Number,
            required: true,
        },
        checkedInAt: {
            type: Date,
            default: Date.now,
        },
        normalizedKey: {
            type: String,
            required: true,
        },
        hasWon: {
            type: Boolean,
            default: false,
        },
        excludedFromRaffle: {
            type: Boolean,
            default: false,
        },
        phoneNumber: {
            type: String,
            trim: true,
        },
        normalizedPhone: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for uniqueness and queries
AttendeeSchema.index({ eventId: 1, ticketNumber: 1 }, { unique: true });
AttendeeSchema.index({ eventId: 1, normalizedKey: 1 }, { unique: true });
AttendeeSchema.index({ eventId: 1, hasWon: 1 });
AttendeeSchema.index({ eventId: 1, excludedFromRaffle: 1 });
AttendeeSchema.index({ eventId: 1, normalizedPhone: 1 }, { unique: true, sparse: true });

const Attendee: Model<IAttendee> =
    mongoose.models.Attendee || mongoose.model<IAttendee>('Attendee', AttendeeSchema);

export default Attendee;
