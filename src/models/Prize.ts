import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPrize extends Document {
    _id: mongoose.Types.ObjectId;
    eventId: mongoose.Types.ObjectId;
    name: string;
    quantityTotal: number;
    quantityRemaining: number;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const PrizeSchema = new Schema<IPrize>(
    {
        eventId: {
            type: Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        quantityTotal: {
            type: Number,
            required: true,
            min: 1,
        },
        quantityRemaining: {
            type: Number,
            required: true,
            min: 0,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for event prizes
PrizeSchema.index({ eventId: 1, order: 1 });

const Prize: Model<IPrize> =
    mongoose.models.Prize || mongoose.model<IPrize>('Prize', PrizeSchema);

export default Prize;
