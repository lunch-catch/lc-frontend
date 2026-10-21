import { useEffect, useRef, useState } from 'react';
import { ChoiceChip } from '@repo/ui';

import {
  type Coupon,
  type CouponFilter,
  fetchCouponSummary,
} from '@user/api/coupon';
import mascotHistoryEmpty from '@user/assets/illustrations/mascot-history-empty.webp';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import EmptyState from '@user/ui/EmptyState/EmptyState';

import CouponCard from './CouponCard';
import { formatClock } from './couponFormat';
import CouponListSkeleton from './CouponListSkeleton';
import CouponLoadError from './CouponLoadError';
import { useCouponHistory } from './useCouponHistory';

type HistoryFilter = 'all' | 'used' | 'expired';

// 사용 가능한 쿠폰은 옆 탭에서 보므로 사용 내역에서는 고르지 않는다
const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'used', label: '사용 완료' },
  { value: 'expired', label: '만료' },
];

// 필터 칩마다 서버에 보낼 필터. 전체는 사용 완료와 만료를 함께 받아야 해서 필터 없이 받고 미사용 쿠폰만 뺀다
// (서버는 한 번에 한 상태만 고를 수 있다)
const serverFilters: Record<HistoryFilter, CouponFilter | undefined> = {
  all: undefined,
  used: 'used',
  expired: 'expired',
};

const filterEmptyMessages: Record<HistoryFilter, string> = {
  all: '사용 내역이 없어요',
  used: '사용한 쿠폰이 없어요',
  expired: '만료된 쿠폰이 없어요',
};

// 사용 완료는 사용한 시각, 만료는 만료된 시각을 기준으로 묶고 정렬한다
const getEventAt = (coupon: Coupon) =>
  coupon.state === 'USED' && coupon.useTime
    ? coupon.useTime
    : coupon.usableEndTime;

const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleDateString('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });

// 최근 것이 위로 오게 정렬한 뒤 같은 날짜끼리 묶는다
const groupByDate = (coupons: Coupon[]) => {
  const groups: { date: string; coupons: Coupon[] }[] = [];

  [...coupons]
    .sort((a, b) => getEventAt(b).localeCompare(getEventAt(a)))
    .forEach((coupon) => {
      const date = formatDate(getEventAt(coupon));
      const lastGroup = groups.at(-1);

      if (lastGroup?.date === date) {
        lastGroup.coupons.push(coupon);
      } else {
        groups.push({ date, coupons: [coupon] });
      }
    });

  return groups;
};

// 쿠폰함 사용 내역 탭. 사용 완료와 만료된 쿠폰을 날짜별로 보여준다
// 계속 쌓이는 목록이라 20개씩 받고, 목록 끝에 가까워지면 다음 20개를 이어서 받는다
const CouponHistory = () => {
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const history = useCouponHistory(serverFilters[filter]);
  // 사용한 횟수는 나눠 받은 목록으로 셀 수 없어 쿠폰 요약의 누적 값을 쓴다. 못 받으면 문구를 숨긴다
  const [usedCount, setUsedCount] = useState<number | null>(null);
  // 목록 끝에 두어, 화면에 가까워지면 다음 페이지를 받는다
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ignore = false;

    fetchCouponSummary()
      .then((summary) => {
        if (!ignore) setUsedCount(summary.usedCouponCount);
      })
      .catch(() => {});

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  const { hasMore, hasMoreError, isLoadingMore, items, loadMore } = history;
  const showSkeleton = useDelayedLoading(items === undefined);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoadingMore || hasMoreError) return;

    // 끝에 닿기 전에 미리 받도록 화면 아래 300px 앞에서 받는다
    // 받은 뒤에도 끝이 화면 안에 있으면(전체에서 미사용 쿠폰을 빼 목록이 짧을 때) 새로 관찰하며 이어서 받는다
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { rootMargin: '0px 0px 300px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasMoreError, isLoadingMore, items, loadMore]);

  const changeFilter = (nextFilter: HistoryFilter) => {
    if (nextFilter === filter) return;
    history.reset();
    setFilter(nextFilter);
  };

  const historyCoupons =
    items?.filter((coupon) => coupon.state !== 'ISSUED') ?? [];
  // 마지막 페이지까지 받았는데 아무것도 없을 때만 비었다고 본다
  const isEmpty = items && !hasMore && historyCoupons.length === 0;

  if (isEmpty && filter === 'all') {
    return (
      <EmptyState
        description="쿠폰을 사용하면 여기에 기록돼요"
        image={mascotHistoryEmpty}
        title="아직 사용 내역이 없어요"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-page pt-3 pb-6">
      <fieldset className="flex gap-2">
        <legend className="sr-only">사용 내역 필터</legend>
        {filterOptions.map((option) => (
          <ChoiceChip
            checked={filter === option.value}
            key={option.value}
            name="coupon-history-filter"
            onChange={() => changeFilter(option.value)}
            value={option.value}
          >
            {option.label}
          </ChoiceChip>
        ))}
      </fieldset>
      {usedCount !== null && (
        <p className="text-caption-mobile text-text-secondary">
          지금까지 쿠폰을{' '}
          <strong className="font-bold text-text-primary">{usedCount}번</strong>{' '}
          사용했어요
        </p>
      )}
      {items === null && <CouponLoadError onRetry={history.retry} />}
      {items === undefined && (
        <>
          {/* 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다 */}
          {showSkeleton && <CouponListSkeleton />}
          <p className="sr-only" role="status">
            사용 내역을 불러오는 중이에요
          </p>
        </>
      )}
      {isEmpty && (
        <p className="py-10 text-center text-body-sm-mobile text-text-secondary">
          {filterEmptyMessages[filter]}
        </p>
      )}
      {groupByDate(historyCoupons).map((group) => (
        <section className="flex flex-col gap-2" key={group.date}>
          <h3 className="text-caption-mobile font-bold text-text-secondary">
            {group.date}
          </h3>
          <ul className="flex flex-col gap-3">
            {group.coupons.map((coupon) => (
              <CouponCard
                coupon={coupon}
                detail={
                  coupon.state === 'USED'
                    ? `사용 완료 · ${formatClock(getEventAt(coupon))}`
                    : `만료 · ${formatClock(getEventAt(coupon))}`
                }
                dimmed
                key={coupon.memberCouponId}
              />
            ))}
          </ul>
        </section>
      ))}
      {items && hasMore && (
        <div ref={sentinelRef}>
          {hasMoreError ? (
            <CouponLoadError onRetry={loadMore} />
          ) : (
            <>
              <CouponListSkeleton />
              <p className="sr-only" role="status">
                사용 내역을 더 불러오는 중이에요
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponHistory;
