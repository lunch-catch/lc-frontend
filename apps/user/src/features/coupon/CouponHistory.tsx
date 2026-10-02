import { useEffect, useState } from 'react';

import { type Coupon, fetchCoupons } from '@user/api/coupon';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ChoiceChip from '@user/components/ChoiceChip/ChoiceChip';
import EmptyState from '@user/components/EmptyState/EmptyState';

import CouponCard from './CouponCard';
import CouponListSkeleton from './CouponListSkeleton';

type HistoryFilter = 'all' | 'used' | 'expired';

// 사용 가능한 쿠폰은 옆 탭에서 보므로 사용 내역에서는 고르지 않는다
const filterOptions: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'used', label: '사용 완료' },
  { value: 'expired', label: '만료' },
];

const filterEmptyMessages: Record<HistoryFilter, string> = {
  all: '사용 내역이 없어요',
  used: '사용한 쿠폰이 없어요',
  expired: '만료된 쿠폰이 없어요',
};

// 사용 완료는 사용한 시각, 만료는 만료된 시각을 기준으로 묶고 정렬한다
const getEventAt = (coupon: Coupon) =>
  coupon.status === 'used' && coupon.usedAt ? coupon.usedAt : coupon.expiresAt;

const formatDate = (isoString: string) =>
  new Date(isoString).toLocaleDateString('ko-KR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  });

const formatTime = (isoString: string) =>
  new Date(isoString).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
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
const CouponHistory = () => {
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  useEffect(() => {
    let ignore = false;

    fetchCoupons().then((items) => {
      if (ignore) return;
      setCoupons(items.filter((coupon) => coupon.status !== 'available'));
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  if (coupons?.length === 0) {
    return (
      <EmptyState
        description="쿠폰을 사용하면 여기에 기록돼요"
        image={mascotEmpty}
        title="아직 사용 내역이 없어요"
      />
    );
  }

  const usedCount =
    coupons?.filter((coupon) => coupon.status === 'used').length ?? 0;
  const filteredCoupons =
    coupons?.filter((coupon) => filter === 'all' || coupon.status === filter) ??
    [];

  return (
    <div className="flex flex-col gap-4 px-page pt-3 pb-6">
      <fieldset className="flex gap-2">
        <legend className="sr-only">사용 내역 필터</legend>
        {filterOptions.map((option) => (
          <ChoiceChip
            checked={filter === option.value}
            key={option.value}
            name="coupon-history-filter"
            onChange={() => setFilter(option.value)}
            value={option.value}
          >
            {option.label}
          </ChoiceChip>
        ))}
      </fieldset>
      {!coupons && (
        <>
          <CouponListSkeleton />
          <p className="sr-only" role="status">
            사용 내역을 불러오는 중이에요
          </p>
        </>
      )}
      {coupons && (
        <>
          <p className="text-caption-mobile text-text-secondary">
            지금까지 쿠폰을{' '}
            <strong className="font-bold text-text-primary">
              {usedCount}번
            </strong>{' '}
            사용했어요
          </p>
          {filteredCoupons.length === 0 && (
            <p className="py-10 text-center text-body-sm-mobile text-text-secondary">
              {filterEmptyMessages[filter]}
            </p>
          )}
          {groupByDate(filteredCoupons).map((group) => (
            <section className="flex flex-col gap-2" key={group.date}>
              <h3 className="text-caption-mobile font-bold text-text-secondary">
                {group.date}
              </h3>
              <ul className="flex flex-col gap-3">
                {group.coupons.map((coupon) => (
                  <CouponCard
                    coupon={coupon}
                    detail={
                      coupon.status === 'used'
                        ? `사용 완료 · ${formatTime(getEventAt(coupon))}`
                        : `만료 · ${formatTime(getEventAt(coupon))}`
                    }
                    dimmed
                    key={coupon.issueId}
                  />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
};

export default CouponHistory;
