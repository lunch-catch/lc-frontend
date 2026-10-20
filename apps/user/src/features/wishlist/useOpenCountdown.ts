import { useEffect, useState } from 'react';

import { getNow, getTodayAt } from '@user/api/clock';

// 매일 11:00 선착순 오픈, 14:00 발급 마감 (서버 coupon.issue-start-time, issue-end-time)
const OPEN_TIME = '11:00';
const CLOSE_TIME = '14:00';
const TICK_MS = 1000;

// 오늘 11:00까지 남은 시간과 오늘 발급이 끝났는지
// 오픈 전에는 1초마다 시계를 돌리고, 오픈 뒤에는 마감 시각에 한 번만 깨운다
export const useOpenCountdown = () => {
  const [now, setNow] = useState(getNow);

  const remainingMs = getTodayAt(OPEN_TIME, now) - now;
  const isOpen = remainingMs <= 0;
  const closeAt = getTodayAt(CLOSE_TIME, now);
  const isIssueClosed = now >= closeAt;

  useEffect(() => {
    if (isIssueClosed) return;

    if (!isOpen) {
      const timer = setInterval(() => setNow(getNow()), TICK_MS);
      return () => clearInterval(timer);
    }

    const timer = setTimeout(() => setNow(getNow()), closeAt - getNow());
    return () => clearTimeout(timer);
  }, [closeAt, isIssueClosed, isOpen]);

  return { isIssueClosed, isOpen, remainingMs };
};

// 남은 시간을 00:30:00 모양으로 바꾼다. 마지막 1초까지 보이도록 올림한다
export const formatCountdown = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
};
