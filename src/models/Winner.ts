import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWinnerSnapshot {
    fullName: string;
    department: string;
    ticketNumber: number;
}

export interface IWinner extends Document {
    _id: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    prizeId: mongoose.Types.ObjectId;
    drawRunId: mongoose.Types.ObjectId;
    attendeeId: mongoose.Types.ObjectId;
    snapshot: IWinnerSnapshot;
    wonAt: Date;
}

const WinnerSchema = new Schema<IWinner>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
            index: true,
        },
        prizeId: {
            type: Schema.Types.ObjectId,
            ref: 'Prize',
            required: true,
        },
        drawRunId: {
            type: Schema.Types.ObjectId,
            ref: 'DrawRun',
            required: true,
        },
        attendeeId: {
            type: Schema.Types.ObjectId,
            ref: 'Attendee',
            required: true,
        },
        snapshot: {
            fullName: { type: String, required: true },
            department: { type: String, required: true },
            ticketNumber: { type: Number, required: true },
        },
        wonAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one person wins only once per event
WinnerSchema.index({ eventId: 1, attendeeId: 1 }, { unique: true });
// Index for history and filtering
WinnerSchema.index({ eventId: 1, prizeId: 1, wonAt: -1 });

const Winner: Model<IWinner> =
    mongoose.models.Winner || mongoose.model<IWinner>('Winner', WinnerSchema);

export default Winner;
