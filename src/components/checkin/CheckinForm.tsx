'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ApiResponse, CheckinResponse } from '@/types';
import { formatTicketNumber } from '@/lib/helpers';

interface CheckinFormProps {
  eventCode: string;
  eventName: string;
  onSuccess?: (data: CheckinResponse) => void;
}

const icon = {
  phone: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.86.32 1.7.57 2.5a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.58-1.09a2 2 0 0 1 2.11-.45c.8.25 1.64.45 2.5.57A2 2 0 0 1 22 16.92Z" />
    </svg>
  ),
  user: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  dept: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h1" />
      <path d="M9 12h1" />
      <path d="M9 15h1" />
      <path d="M14 9h1" />
      <path d="M14 12h1" />
      <path d="M14 15h1" />
    </svg>
  ),
  spark: (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l1.2 4.2L18 8l-4.8 1.8L12 14l-1.2-4.2L6 8l4.8-1.8L12 2Z" />
      <path d="M19 13l.8 2.8L23 17l-3.2 1.2L19 21l-.8-2.8L15 17l3.2-1.2L19 13Z" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
};

export default function CheckinForm({ eventCode, eventName, onSuccess }: CheckinFormProps) {
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CheckinResponse | null>(null);

  const normalizedPhone = useMemo(() => phoneNumber.replace(/\D/g, '').slice(0, 11), [phoneNumber]);

  const reset = () => {
    setSuccess(null);
    setError(null);
    setIsSubmitting(false);
    setFullName('');
    setDepartment('');
    setPhoneNumber('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventCode, fullName, department, phoneNumber: normalizedPhone }),
      });

      const data: ApiResponse<CheckinResponse> = await response.json();

      if (!data.success) {
        setError(data.error || 'Đã xảy ra lỗi');
        return;
      }

      const payload = data.data!;
      setSuccess(payload);
      onSuccess?.(payload);
    } catch {
      setError('Không thể kết nối đến server. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {/* Background */}
      <div className="min-h-[calc(100vh-2rem)] rounded-3xl bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 p-4 sm:p-8">
        <div className="mx-auto max-w-md space-y-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl">
            <div className="absolute inset-0 opacity-[0.08]">
              {/* subtle "road stripes" */}
              <div className="h-full w-full bg-[linear-gradient(135deg,transparent_0,transparent_45%,rgba(255,255,255,0.5)_45%,rgba(255,255,255,0.5)_55%,transparent_55%,transparent_100%)] bg-[length:26px_26px]" />
            </div>

            <div className="relative flex items-center gap-4">
              <div className="shrink-0 rounded-2xl bg-white/10 p-3">
                <Image src="/logo.png" alt="PVOIL" width={120} height={48} className="h-8 w-auto object-contain" priority />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide text-emerald-300/90">PVOIL VŨNG ÁNG</p>
                <p className="mt-1 truncate text-sm text-white/70">{eventName}</p>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, scale: 0.98 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <Card className="overflow-hidden border border-white/10 bg-white/[0.03] shadow-2xl">
                  <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200 ring-1 ring-white/10">
                        {icon.check}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Check-in thành công</h2>
                        <p className="text-sm text-white/70">Mã dự thưởng đã được ghi nhận</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="space-y-5 p-6">
                    {/* Ticket */}
                    <div className="rounded-2xl border border-dashed border-white/20 bg-gradient-to-b from-white/5 to-white/[0.02] p-5">
                      <p className="text-center text-xs tracking-wide text-white/60">MÃ SỐ DỰ THƯỞNG</p>
                      <div className="mt-2 text-center text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-300 to-orange-300">
                        #{formatTicketNumber(success.ticketNumber)}
                      </div>
                      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-white/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Vui lòng chụp màn hình này để đối chiếu!
                      </div>
                    </div>

                    {/* Details */}
                    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm">
                      {success.phoneNumber && (
                        <div className="flex items-center justify-between gap-3 py-2">
                          <span className="text-white/60">Số điện thoại</span>
                          <span className="font-semibold text-white">{success.phoneNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 py-2">
                        <span className="text-white/60">Họ tên</span>
                        <span className="font-semibold text-white">{success.fullName}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 py-2">
                        <span className="text-white/60">Phòng ban</span>
                        <span className="font-semibold text-white">{success.department}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        onClick={reset}
                        className="h-12 bg-white/10 hover:bg-white/15 text-white border border-white/10"
                        variant="secondary"
                      >
                        Thoát
                      </Button>

                      <Button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="h-12 bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600 hover:from-amber-500 hover:via-orange-500 hover:to-emerald-500 text-white shadow-lg"
                      >
                        Hoàn tất
                      </Button>
                    </div>

                    <p className="text-center text-xs text-white/60">
                      Chúc bạn may mắn trong chương trình quay thưởng! 🎉
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <Card className="border border-white/10 bg-white/[0.03] shadow-2xl">
                  <CardHeader className="space-y-2 pb-4">
                    <CardTitle className="text-center text-2xl font-extrabold text-white">
                      Thông Tin Tham Dự
                    </CardTitle>
                    <CardDescription className="text-center text-white/60">
                      Nhập đúng thông tin để nhận mã dự thưởng
                    </CardDescription>

                    {isSubmitting && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full w-1/2 bg-gradient-to-r from-amber-400 via-orange-400 to-emerald-400"
                          initial={{ x: '-60%' }}
                          animate={{ x: '220%' }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber" className="text-white/80">
                          Số điện thoại
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">{icon.phone}</span>
                          <Input
                            id="phoneNumber"
                            type="tel"
                            inputMode="numeric"
                            autoComplete="tel"
                            placeholder="Ví dụ: 0912345678"
                            value={normalizedPhone}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/35 focus:border-amber-400 focus:ring-amber-400"
                          />
                        </div>
                        <p className="text-xs text-white/50">Nhập số để hệ thống đối chiếu và liên hệ khi cần.</p>
                      </div>

                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-white/80">
                          Họ và tên
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">{icon.user}</span>
                          <Input
                            id="fullName"
                            type="text"
                            autoComplete="name"
                            placeholder="Nhập họ tên đầy đủ"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            minLength={2}
                            disabled={isSubmitting}
                            className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/35 focus:border-amber-400 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      {/* Department */}
                      <div className="space-y-2">
                        <Label htmlFor="department" className="text-white/80">
                          Phòng ban / Bộ phận
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">{icon.dept}</span>
                          <Input
                            id="department"
                            type="text"
                            placeholder="Ví dụ: Cửa hàng / Văn phòng / Kế toán..."
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            required
                            disabled={isSubmitting}
                            className="h-12 pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/35 focus:border-amber-400 focus:ring-amber-400"
                          />
                        </div>
                      </div>

                      <AnimatePresence>
                        {error && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            role="alert"
                            aria-live="polite"
                            className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-center text-sm text-red-200"
                          >
                            {error}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 w-full text-base font-semibold text-white shadow-lg
                          bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-600
                          hover:from-amber-500 hover:via-orange-500 hover:to-emerald-500
                          disabled:opacity-60 disabled:hover:from-amber-600 disabled:hover:via-orange-600 disabled:hover:to-emerald-600"
                      >
                        {isSubmitting ? (
                          <motion.div
                            aria-label="Đang gửi"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
                          />
                        ) : (
                          'Nhận mã dự thưởng'
                        )}
                      </Button>

                      <p className="text-center text-xs text-white/55">
                        Bằng việc check-in, bạn đồng ý để BTC sử dụng thông tin cho mục đích chương trình.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
