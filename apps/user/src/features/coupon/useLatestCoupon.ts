import { useEffect, useState } from 'react';

import { type Coupon, fetchCoupon } from '@user/api/coupon';

// 아직 쓰지 않은 쿠폰은 이 간격으로 다시 확인해, 점주가 스캔해 사용 처리하면 바로 반영한다
const REFRESH_MS = 5000;

// 쿠폰함 목록에서 받은 쿠폰으로 먼저 보여주고, 단건 조회로 최신 상태를 받아 바꾼다
// 사용 완료나 만료가 되면 더 확인하지 않는다. 확인에 실패하면 마지막 상태를 그대로 둔다
export const useLatestCoupon = (initialCoupon: Coupon) => {
  const [coupon, setCoupon] = useState(initialCoupon);
  const isIssued = coupon.state === 'ISSUED';
  const { memberCouponId } = initialCoupon;

  useEffect(() => {
    if (!isIssued) return;

    let ignore = false;
    const refresh = () => {
      fetchCoupon(memberCouponId)
        .then((latest) => {
          if (!ignore) setCoupon(latest);
        })
        .catch(() => {});
    };

    // 화면을 열자마자 한 번 확인하고, 그 뒤로 일정 간격마다 확인한다
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    // 화면을 닫거나 사용이 끝나면 확인을 멈추고, 늦게 온 응답은 버린다
    return () => {
      ignore = true;
      clearInterval(timer);
    };
  }, [isIssued, memberCouponId]);

  return coupon;
};
