import dbConnect from '@/lib/db';
import { Event } from '@/models';
import HomeClient from '@/components/public/HomeClient';

export default async function Home() {
  await dbConnect();

  // Lấy sự kiện đang "live" mới nhất, nếu không có thì lấy sự kiện mới nhất
  let event = await Event.findOne({ status: 'live' }).sort({ createdAt: -1 });

  if (!event) {
    event = await Event.findOne().sort({ createdAt: -1 });
  }

  // Nếu chưa có sự kiện nào, tự động tạo một sự kiện mặc định
  if (!event) {
    event = await Event.create({
      code: 'default-event',
      name: 'Chương trình dự thưởng',
      status: 'live',
    });
  }

  return (
    <HomeClient
      eventCode={event.code}
      eventName={event.name}
    />
  );
}
