import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGODB_URI =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/event-checkin?replicaSet=rs0';

// Define schemas inline to avoid import issues in scripts
const EventSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['draft', 'live', 'ended'], default: 'draft' },
}, { timestamps: true });

const AttendeeSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    fullName: { type: String, required: true },
    department: { type: String, required: true },
    ticketNumber: { type: Number, required: true },
    normalizedKey: { type: String, required: true },
    phoneNumber: { type: String, trim: true },
    normalizedPhone: { type: String, trim: true },
    hasWon: { type: Boolean, default: false },
    checkedInAt: { type: Date, default: Date.now },
}, { timestamps: true });

const PrizeSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    name: { type: String, required: true },
    quantityTotal: { type: Number, required: true },
    quantityRemaining: { type: Number, required: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

const Event = mongoose.models.Event || mongoose.model('Event', EventSchema);
const Attendee = mongoose.models.Attendee || mongoose.model('Attendee', AttendeeSchema);
const Prize = mongoose.models.Prize || mongoose.model('Prize', PrizeSchema);

const sampleAttendees = [
    { fullName: 'Nguyễn Văn An', department: 'Phòng Kinh doanh', phoneNumber: '0912345001' },
    { fullName: 'Trần Thị Bình', department: 'Phòng Kế toán', phoneNumber: '0912345002' },
    { fullName: 'Lê Văn Cường', department: 'Phòng IT', phoneNumber: '0912345003' },
    { fullName: 'Phạm Thị Dung', department: 'Phòng Nhân sự', phoneNumber: '0912345004' },
    { fullName: 'Hoàng Văn Em', department: 'Phòng Marketing', phoneNumber: '0912345005' },
    { fullName: 'Vũ Thị Phương', department: 'Phòng Kinh doanh', phoneNumber: '0912345006' },
    { fullName: 'Đặng Văn Giang', department: 'Phòng Kỹ thuật', phoneNumber: '0912345007' },
    { fullName: 'Bùi Thị Hoa', department: 'Phòng Hành chính', phoneNumber: '0912345008' },
    { fullName: 'Ngô Văn Inh', department: 'Phòng Kế toán', phoneNumber: '0912345009' },
    { fullName: 'Dương Thị Kim', department: 'Phòng IT', phoneNumber: '0912345010' },
    { fullName: 'Lý Văn Long', department: 'Phòng Kinh doanh', phoneNumber: '0987654321' },
    { fullName: 'Trương Thị Mai', department: 'Phòng Nhân sự', phoneNumber: '0987654322' },
    { fullName: 'Đinh Văn Nam', department: 'Phòng Marketing', phoneNumber: '0987654323' },
    { fullName: 'Hồ Thị Oanh', department: 'Phòng Kỹ thuật', phoneNumber: '0987654324' },
    { fullName: 'Võ Văn Phúc', department: 'Phòng Hành chính', phoneNumber: '0987654325' },
    { fullName: 'Phan Thị Quỳnh', department: 'Phòng IT', phoneNumber: '0987654326' },
    { fullName: 'Đỗ Văn Rôn', department: 'Phòng Kinh doanh', phoneNumber: '0987654327' },
    { fullName: 'Tạ Thị Sen', department: 'Phòng Kế toán', phoneNumber: '0987654328' },
    { fullName: 'Chu Văn Tùng', department: 'Phòng Marketing', phoneNumber: '0987654329' },
    { fullName: 'Huỳnh Thị Uyên', department: 'Phòng Nhân sự', phoneNumber: '0987654330' },
];

const samplePrizes = [
    { name: 'Giải Đặc biệt', quantity: 1, order: 1 },
    { name: 'Giải Nhất', quantity: 2, order: 2 },
    { name: 'Giải Nhì', quantity: 3, order: 3 },
    { name: 'Giải Ba', quantity: 5, order: 4 },
    { name: 'Giải Khuyến khích', quantity: 10, order: 5 },
];

async function seed() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await Event.deleteMany({});
        await Attendee.deleteMany({});
        await Prize.deleteMany({});

        // Create sample event
        console.log('📅 Creating sample event...');
        const event = await Event.create({
            code: 'yearend-2026',
            name: 'Tiệc Tất Niên 2026',
            status: 'live',
        });
        console.log(`✅ Created event: ${event.name} (code: ${event.code})`);

        // Create sample attendees
        console.log('👥 Creating sample attendees...');
        const slugify = (text: string) => text.toLowerCase().trim()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

        const normalizePhone = (phone: string) => {
            const digits = phone.replace(/\D/g, '');
            if (digits.startsWith('84') && digits.length === 11) return digits;
            if (digits.startsWith('0') && digits.length === 10) return '84' + digits.slice(1);
            return digits;
        };

        for (let i = 0; i < sampleAttendees.length; i++) {
            const a = sampleAttendees[i];
            await Attendee.create({
                eventId: event._id,
                fullName: a.fullName,
                department: a.department,
                ticketNumber: i + 1,
                normalizedKey: `${slugify(a.fullName)}|${slugify(a.department)}`,
                phoneNumber: a.phoneNumber,
                normalizedPhone: normalizePhone(a.phoneNumber),
                hasWon: false,
                checkedInAt: new Date(),
            });
        }
        console.log(`✅ Created ${sampleAttendees.length} attendees`);

        // Create sample prizes
        console.log('🎁 Creating sample prizes...');
        for (const p of samplePrizes) {
            await Prize.create({
                eventId: event._id,
                name: p.name,
                quantityTotal: p.quantity,
                quantityRemaining: p.quantity,
                order: p.order,
            });
        }
        console.log(`✅ Created ${samplePrizes.length} prizes`);

        console.log('\n🎉 Seed completed successfully!');
        console.log(`\n📍 Check-in URL: http://localhost:3000/checkin/${event.code}`);
        console.log(`🎰 Raffle URL: http://localhost:3000/raffle/${event.code}`);
        console.log(`👤 Admin: http://localhost:3000/admin`);
        console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@example.com'}`);
        console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123456'}`);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

seed();
