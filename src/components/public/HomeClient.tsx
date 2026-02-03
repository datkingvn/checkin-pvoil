'use client';

import CheckinForm from '@/components/checkin/CheckinForm';

interface HomeClientProps {
  eventCode: string;
  eventName: string;
}

export default function HomeClient({ eventCode, eventName }: HomeClientProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white flex flex-col items-center py-6 px-3">
      <div className="w-full max-w-4xl">
        <CheckinForm
          eventCode={eventCode}
          eventName={eventName}
        />
      </div>
    </div>
  );
}

