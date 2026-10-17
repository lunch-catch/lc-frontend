import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';

import { dashboardRangeLimits } from './dashboardUtils';

export const DashboardRangeGuide = () => {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useLayoutEffect(() => {
    if (!open || !tooltipRef.current || !rootRef.current) return;
    const tooltip = tooltipRef.current;
    const root = rootRef.current;
    const updatePosition = () => {
      tooltip.style.left = '100%';
      tooltip.style.right = 'auto';
      tooltip.style.transform = 'translateY(-50%)';
      let rect = tooltip.getBoundingClientRect();
      // 오른쪽을 우선하고 공간이 부족하면 왼쪽으로 전환한 뒤 화면 안으로 보정한다.
      if (
        rect.right > window.innerWidth - 12 &&
        root.getBoundingClientRect().left - rect.width >= 12
      ) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '100%';
        rect = tooltip.getBoundingClientRect();
      }
      const offset =
        rect.left < 12
          ? 12 - rect.left
          : Math.min(0, window.innerWidth - 12 - rect.right);
      tooltip.style.transform = `translate(${offset}px, -50%)`;
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
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
          className="absolute left-full top-1/2 z-40 w-max max-w-[calc(100vw-2rem)] px-1"
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
