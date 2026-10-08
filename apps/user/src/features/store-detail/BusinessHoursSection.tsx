import { ChevronDown } from 'lucide-react';

import { getNow } from '@user/api/clock';
import type { StoreBusinessHour } from '@user/api/store';

import {
  DAY_LABELS,
  getOpenStatus,
  getTodayHour,
  OPEN_STATUS_LABELS,
} from './businessHours';

interface BusinessHoursSectionProps {
  hours: StoreBusinessHour[];
}

const formatHours = (hour: StoreBusinessHour) =>
  hour.isClosed || !hour.openTime || !hour.closeTime
    ? '휴무'
    : `${hour.openTime} – ${hour.closeTime}`;

// 영업 정보. 쿠폰을 쓰러 가기 전에 지금 열었는지가 가장 궁금하므로 오늘 상태를 먼저 보여준다
const BusinessHoursSection = ({ hours }: BusinessHoursSectionProps) => {
  const now = getNow();
  const today = getTodayHour(hours, now);
  const status = getOpenStatus(today, now);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-h3-mobile font-bold text-text-primary">영업 정보</h2>
      <div className="rounded-xl border border-border-subtle bg-bg-surface p-4">
        <p className="flex items-center gap-2 text-body-mobile">
          <span
            className={`font-bold ${
              status === 'open'
                ? 'text-status-success-fg'
                : 'text-text-secondary'
            }`}
          >
            {OPEN_STATUS_LABELS[status]}
          </span>
          {today && status !== 'dayOff' && (
            <span className="text-text-primary">{formatHours(today)}</span>
          )}
        </p>
        {today?.breakStartTime && today.breakEndTime && (
          <p className="mt-1 text-caption-mobile text-text-secondary">
            브레이크타임 {today.breakStartTime} – {today.breakEndTime}
            {today.lastOrderTime && ` · 라스트오더 ${today.lastOrderTime}`}
          </p>
        )}
        <details className="group mt-3 border-t border-border-subtle pt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between text-body-sm-mobile text-text-secondary [&::-webkit-details-marker]:hidden">
            요일별 영업시간
            <ChevronDown
              aria-hidden="true"
              className="size-4 transition-transform group-open:rotate-180"
            />
          </summary>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-body-sm-mobile">
            {hours.map((hour) => (
              <div className="contents" key={hour.dayOfWeek}>
                <dt
                  className={
                    hour === today
                      ? 'font-bold text-text-primary'
                      : 'text-text-secondary'
                  }
                >
                  {DAY_LABELS[hour.dayOfWeek]}
                </dt>
                <dd
                  className={
                    hour.isClosed ? 'text-text-tertiary' : 'text-text-primary'
                  }
                >
                  {formatHours(hour)}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </section>
  );
};

export default BusinessHoursSection;
