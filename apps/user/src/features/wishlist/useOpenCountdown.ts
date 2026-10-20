import { useEffect, useState } from 'react';

import { getNow, getTodayAt } from '@user/api/clock';

// 매일 11:00 선착순 오픈, 14:00 발급 마감 (서버 coupon.issue-start-time, issue-end-time)
const OPEN_TIME = '11:00';
const CLOSE_TIME = '14:00';
const TICK_MS = 1000;

// 그 시각의 발급 단계. beforeOpen: 11:00 전, issuing: 11:00~14:00, closed: 14:00 뒤
export type IssuePhase = 'beforeOpen' | 'issuing' | 'closed';

export const getIssuePhase = (now = getNow()): IssuePhase => {
  if (now < getTodayAt(OPEN_TIME, now)) return 'beforeOpen';
  return now < getTodayAt(CLOSE_TIME, now) ? 'issuing' : 'closed';
};

// 오늘 11:00까지 남은 시간과 오늘 발급이 끝났는지
// 오픈 전에는 1초마다 시계를 돌리고, 오픈 뒤에는 마감 시각에 한 번만 깨운다
// 한 번만 알면 되는 곳(찜한 순간의 토스트)은 화면이 매초 다시 그려지지 않게 getIssuePhase를 쓴다
export const useOpenCountdown = () => {
  const [now, setNow] = useState(getNow);

  const remainingMs = getTodayAt(OPEN_TIME, now) - now;
  const phase = getIssuePhase(now);
  const isOpen = phase !== 'beforeOpen';
  const isIssueClosed = phase === 'closed';
  const closeAt = getTodayAt(CLOSE_TIME, now);

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
