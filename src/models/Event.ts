import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEvent extends Document {
    _id: mongoose.Types.ObjectId;
    code: string;
    name: string;
    status: 'draft' | 'live' | 'ended';
    currentDrawPrizeId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
    {
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            match: /^[a-z0-9-]+$/,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: ['draft', 'live', 'ended'],
            default: 'draft',
        },
        currentDrawPrizeId: {
            type: Schema.Types.ObjectId,
            ref: 'Prize',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Event: Model<IEvent> =
    mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);

export default Event;
