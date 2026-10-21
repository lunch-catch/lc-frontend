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

// 지금 찜하면 쿠폰을 언제 받는지. 찜한 뒤 토스트에서 쓴다 (스와이프, 가게 상세)
// 카드 아래 안내(SwipeHint)와 같은 때를 말한다
export const WISH_ISSUE_TIMING: Record<IssuePhase, string> = {
  beforeOpen: '11:00부터 쿠폰을 받을 수 있어요',
  issuing: '지금 바로 쿠폰을 받을 수 있어요',
  closed: '내일 11:00부터 쿠폰을 받을 수 있어요',
};

// 다음 날 00:00. 마감 뒤에는 이때 날이 바뀌어 다시 오픈 전이 된다
const getNextMidnight = (now: number) => {
  const date = new Date(now);
  date.setHours(24, 0, 0, 0);
  return date.getTime();
};

// 오늘 11:00까지 남은 시간과 오늘 발급이 끝났는지
// 오픈 전에는 1초마다 시계를 돌리고, 발급 중에는 14:00 마감에, 마감 뒤에는 다음 날 00:00에 한 번만 깨운다
// 마감 뒤에 깨우지 않으면 화면을 켜 둔 채 날이 바뀌어도 '내일 11:00부터'가 남는다
// 한 번만 알면 되는 곳(찜한 순간의 토스트)은 화면이 매초 다시 그려지지 않게 getIssuePhase를 쓴다
export const useOpenCountdown = () => {
  const [now, setNow] = useState(getNow);

  const remainingMs = getTodayAt(OPEN_TIME, now) - now;
  const phase = getIssuePhase(now);
  const isOpen = phase !== 'beforeOpen';
  const isIssueClosed = phase === 'closed';
  // 다음에 단계가 바뀌는 시각. 오픈 전에는 1초마다 돌아서 쓰지 않는다
  const nextChangeAt = isIssueClosed
    ? getNextMidnight(now)
    : getTodayAt(CLOSE_TIME, now);

  useEffect(() => {
    if (!isOpen) {
      const timer = setInterval(() => setNow(getNow()), TICK_MS);
      return () => clearInterval(timer);
    }

    // 브라우저 타이머가 조금 일찍 깨거나 휴대폰 시계가 바뀌면 아직 그 시각 전일 수 있다
    // 그러면 단계가 그대로라 이 effect가 다시 돌지 않으니, 남은 시간만큼 다시 건다
    let timer: ReturnType<typeof setTimeout>;
    const wakeAtChange = () => {
      const current = getNow();
      setNow(current);
      if (current < nextChangeAt) {
        timer = setTimeout(wakeAtChange, nextChangeAt - current);
      }
    };
    timer = setTimeout(wakeAtChange, nextChangeAt - getNow());
    return () => clearTimeout(timer);
  }, [isOpen, nextChangeAt]);

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
