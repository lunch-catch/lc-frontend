import { useEffect, useState } from 'react';

// 매일 11:00 선착순 오픈
const OPEN_HOUR = 11;
const TICK_MS = 1000;

// 주소에 ?mockTime=10:59:50 처럼 붙이면 그 시각부터 시계가 흐르는 것으로 확인할 수 있다
const getClockOffsetMs = () => {
  const mockTime = new URLSearchParams(window.location.search).get('mockTime');
  if (!mockTime) return 0;

  const [hours = 0, minutes = 0, seconds = 0] = mockTime.split(':').map(Number);
  const mockNow = new Date();
  mockNow.setHours(hours, minutes, seconds, 0);

  return mockNow.getTime() - Date.now();
};

// 오늘 11:00까지 남은 시간. 오픈이 지나면 시계를 멈춘다
export const useOpenCountdown = () => {
  const [clockOffsetMs] = useState(getClockOffsetMs);
  const [now, setNow] = useState(() => Date.now() + clockOffsetMs);

  const openAt = new Date(now);
  openAt.setHours(OPEN_HOUR, 0, 0, 0);
  const remainingMs = openAt.getTime() - now;
  const isOpen = remainingMs <= 0;

  useEffect(() => {
    if (isOpen) return;

    const timer = setInterval(
      () => setNow(Date.now() + clockOffsetMs),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, [clockOffsetMs, isOpen]);

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
