# Event Check-in + Lucky Draw System

Hệ thống check-in sự kiện và quay thưởng may mắn với hiệu ứng đẹp mắt.

## 🚀 Tính năng

- ✅ **QR Check-in**: Tạo QR code để người tham dự check-in nhanh chóng
- ✅ **Quay thưởng đẹp mắt**: Animation slot machine, confetti, spotlight
- ✅ **Admin Dashboard**: Quản lý sự kiện, giải thưởng, danh sách check-in
- ✅ **Bảo mật dữ liệu**: Transaction MongoDB đảm bảo không trùng người thắng
- ✅ **Export CSV**: Xuất danh sách người thắng

## 📋 Yêu cầu hệ thống

- Node.js 18+
- MongoDB chạy **replica set** (local single-node replica set hoặc Atlas/cluster)

## 🛠️ Cài đặt

### 1. Clone và cài dependencies

```bash
cd checkin-pvoil-2
npm install
```

### 2. Cấu hình MongoDB (bắt buộc replica set)

Để tính năng **quay thưởng không trùng người thắng** hoạt động an toàn, hệ thống dùng **MongoDB transaction**.  
Điều này yêu cầu MongoDB phải chạy ở chế độ **replica set** (hoặc cluster), KHÔNG hỗ trợ chạy trên standalone.

Bạn có 2 lựa chọn:

- **Local (khuyến nghị cho dev)**: chạy single-node replica set (`rs0`) trên `localhost`.
- **Cloud/Production**: dùng MongoDB Atlas (hoặc cluster tự quản lý) với replica set.

#### Local single-node replica set (MongoDB cài trực tiếp)

1. Dừng mọi tiến trình `mongod` đang chạy.
2. Tạo thư mục data riêng (ví dụ):

```bash
mkdir -p ~/data/mongodb-rs0
```

3. Khởi động `mongod` với replica set:

```bash
mongod --dbpath ~/data/mongodb-rs0 --replSet rs0 --bind_ip localhost
```

4. Mở terminal khác, vào shell và khởi tạo replica set (chỉ cần chạy **một lần**):

```bash
mongosh
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

5. Sau khi `rs.status()` báo OK, bạn có thể dùng connection string:

```env
MONGODB_URI=mongodb://localhost:27017/event-checkin?replicaSet=rs0
```

#### Dùng MongoDB Atlas (hoặc cluster có sẵn replica set)

1. Tạo cluster trên Atlas.
2. Vào mục **Connect** → **Drivers** và copy connection string có dạng:

```text
mongodb+srv://<user>:<password>@<cluster-host>/event-checkin?retryWrites=true&w=majority
```

3. Dán vào biến môi trường `MONGODB_URI` (thay `<user>`, `<password>`, `<cluster-host>` tương ứng).

> Lưu ý: Atlas cluster mặc định đã là replica set, không cần tự `rs.initiate`.

### 3. Cấu hình môi trường

Copy file `.env.example` thành `.env.local` và cập nhật:

```bash
cp .env.example .env.local
```

Ví dụ cấu hình `.env.local` dùng local replica set:

```env
MONGODB_URI=mongodb://localhost:27017/event-checkin?replicaSet=rs0
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123456
```

### 4. Chạy seed data (tùy chọn)

```bash
npx tsx scripts/seed.ts
```

### 5. Khởi động server

```bash
npm run dev
```

Truy cập: http://localhost:3000

## 📖 Hướng dẫn sử dụng

### Admin

1. Truy cập `/admin/login`
2. Đăng nhập với email/password trong `.env.local`
3. Tạo sự kiện mới tại `/admin/events`
4. Thêm giải thưởng trong chi tiết sự kiện
5. Đổi trạng thái sang "Đang mở" để bật check-in
6. Lấy QR code để in/chiếu

### Check-in

1. Người tham dự quét QR code
2. Nhập họ tên và phòng ban
3. Nhận mã số tham dự

### Quay thưởng

1. Mở `/raffle/[eventCode]` trên màn hình lớn
2. Đăng nhập admin để thấy nút QUAY
3. Chọn giải thưởng và bấm QUAY
4. Tận hưởng animation slot machine 🎰
5. Confetti và spotlight cho người thắng 🎉

## 🔗 URLs chính

| URL                    | Mô tả                    |
| ---------------------- | ------------------------ |
| `/admin`               | Dashboard quản trị       |
| `/admin/events`        | Quản lý sự kiện          |
| `/checkin/[eventCode]` | Trang check-in công khai |
| `/raffle/[eventCode]`  | Màn hình quay thưởng     |

## 🛡️ Bảo mật

- Mỗi người chỉ trúng thưởng 1 lần trong 1 sự kiện
- Không thể quay vượt số lượng giải
- Rate limiting cho check-in (5 giây/request)
- MongoDB transaction (yêu cầu MongoDB chạy replica set) đảm bảo data consistency

## 🚀 Triển khai (staging/production)

- **Bắt buộc** dùng MongoDB có hỗ trợ **replica set** (MongoDB Atlas, replica set tự quản lý hoặc sharded cluster).
- Biến môi trường `MONGODB_URI` phải trỏ tới connection string của replica set/cluster.
- Ví dụ (Atlas):
  - `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster-host>/event-checkin?retryWrites=true&w=majority`
- Ví dụ (tự quản lý replica set):
  - `MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/event-checkin?replicaSet=rs0`
- Chạy trên MongoDB standalone sẽ gây lỗi `Transaction numbers are only allowed on a replica set member or mongos` khi quay thưởng và **không được hỗ trợ** trong môi trường staging/production.

## 📁 Cấu trúc thư mục

```
src/
├── app/
│   ├── admin/           # Admin pages
│   ├── api/             # API routes
│   ├── checkin/         # Public check-in
│   └── raffle/          # Raffle display
├── components/
│   ├── admin/           # Admin components
│   ├── checkin/         # Check-in components
│   ├── raffle/          # Raffle components
│   └── ui/              # shadcn/ui components
├── lib/
│   ├── auth.ts          # NextAuth config
│   ├── db.ts            # MongoDB connection
│   ├── helpers.ts       # Utility functions
│   └── crypto-random.ts # Secure random
├── models/              # Mongoose models
└── types/               # TypeScript types
```

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB + Mongoose
- **Auth**: NextAuth.js
- **Styling**: TailwindCSS + shadcn/ui
- **Animation**: Framer Motion + canvas-confetti
- **QR Code**: qrcode

## 📝 License

MIT
