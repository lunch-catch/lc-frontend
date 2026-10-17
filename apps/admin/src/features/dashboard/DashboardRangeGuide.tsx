import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

import { dashboardRangeLimits } from './dashboardUtils';

export const DashboardRangeGuide = () => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const updatePosition = () => {
      // 좁은 화면에서도 안내가 뷰포트 밖으로 잘리지 않도록 가로 위치만 보정한다.
      tooltip.style.transform = 'none';
      const rect = tooltip.getBoundingClientRect();
      const offset =
        rect.left < 12
          ? 12 - rect.left
          : Math.min(0, window.innerWidth - 12 - rect.right);
      tooltip.style.transform = `translateX(${offset}px)`;
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative inline-flex shrink-0"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        if (!rootRef.current?.contains(document.activeElement)) setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="조회 기간 안내"
        aria-describedby={open ? id : undefined}
        className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-brand focus-visible:outline-2 focus-visible:outline-action-primary"
      >
        <Info aria-hidden className="size-4" />
      </button>
      {open && (
        <div
          ref={tooltipRef}
          id={id}
          role="tooltip"
          className="absolute right-0 top-full z-40 w-max max-w-[calc(100vw-2rem)] pt-1"
        >
          <div className="rounded-sm border border-border-subtle bg-bg-surface px-2 py-1 text-caption-web text-text-primary shadow-sm">
            일별 최대 {dashboardRangeLimits.day}일 · 주별 최대{' '}
            {dashboardRangeLimits.week}주 · 월별 최대{' '}
            {dashboardRangeLimits.month}
            개월. 주별은 월요일 기준입니다.
          </div>
        </div>
      )}
    </div>
  );
};
