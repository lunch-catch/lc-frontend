import { useEffect, useState } from 'react';

import { getNow, getTodayAt } from '@user/api/clock';

// 매일 11:00 선착순 오픈
const OPEN_TIME = '11:00';
const TICK_MS = 1000;

// 오늘 11:00까지 남은 시간. 오픈이 지나면 시계를 멈춘다
export const useOpenCountdown = () => {
  const [now, setNow] = useState(getNow);

  const remainingMs = getTodayAt(OPEN_TIME, now) - now;
  const isOpen = remainingMs <= 0;

  useEffect(() => {
    if (isOpen) return;

    const timer = setInterval(() => setNow(getNow()), TICK_MS);
    return () => clearInterval(timer);
  }, [isOpen]);

  return { isOpen, remainingMs };
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
