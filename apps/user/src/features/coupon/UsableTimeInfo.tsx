import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

import { getNow } from '@user/api/clock';

import { formatClock } from './couponFormat';

// 1분마다 다시 그려 남은 시간을 맞춘다. 분 단위로만 보여줘서 더 자주 그릴 필요가 없다
const TICK_MS = 60_000;
// 이보다 적게 남으면 주황 글자로 바꿔 곧 끝난다는 걸 알린다
const SOON_MS = 30 * 60_000;

const formatRemaining = (ms: number) => {
  const minutes = Math.max(1, Math.ceil(ms / 60_000));
  if (minutes < 60) return `${minutes}분 남음`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}시간 남음` : `${hours}시간 ${rest}분 남음`;
};

interface UsableTimeInfoProps {
  usableStartTime: string;
  usableEndTime: string;
}

// 사용 가능 쿠폰 카드 아래 줄의 사용 시간. 받은 쿠폰은 시간이 지나면 못 쓰므로 언제까지, 얼마나 남았는지를 보여준다
// 사용 시간 전이면 언제부터 쓸 수 있는지, 끝났으면 지났다고 알린다 (목록을 다시 받기 전까지 남아 있을 수 있다)
const UsableTimeInfo = ({
  usableEndTime,
  usableStartTime,
}: UsableTimeInfoProps) => {
  const [now, setNow] = useState(getNow);

  useEffect(() => {
    const timer = setInterval(() => setNow(getNow()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const startAt = Date.parse(usableStartTime);
  const endAt = Date.parse(usableEndTime);

  const getText = () => {
    if (now < startAt) return `${formatClock(usableStartTime)}부터 사용`;
    if (now >= endAt) return '사용 시간이 지났어요';
    return `${formatClock(usableEndTime)}까지 · ${formatRemaining(endAt - now)}`;
  };
  const isSoon = now >= startAt && now < endAt && endAt - now <= SOON_MS;

  return (
    <>
      <Clock aria-hidden="true" className="size-3.5 shrink-0" />
      <span className={`truncate ${isSoon ? 'font-bold text-text-brand' : ''}`}>
        {getText()}
      </span>
    </>
  );
};

export default UsableTimeInfo;
