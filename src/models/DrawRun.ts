import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDrawRun extends Document {
    _id: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    prizeId: mongoose.Types.ObjectId;
    createdBy: string;
    createdAt: Date;
}

const DrawRunSchema = new Schema<IDrawRun>(
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
        createdBy: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Index for history queries
DrawRunSchema.index({ eventId: 1, createdAt: -1 });

const DrawRun: Model<IDrawRun> =
    mongoose.models.DrawRun || mongoose.model<IDrawRun>('DrawRun', DrawRunSchema);

export default DrawRun;
