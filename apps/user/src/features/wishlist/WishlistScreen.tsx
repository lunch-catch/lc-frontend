import { useEffect, useState } from 'react';

import { fetchIssueStatus, type IssueStatusResponse } from '@user/api/coupon';
import { fetchWishlist, type WishItem } from '@user/api/wishlist';

import WishlistSummary from './WishlistSummary';

const WishlistScreen = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [issueStatus, setIssueStatus] = useState<IssueStatusResponse | null>(
    null,
  );

  useEffect(() => {
    let ignore = false;

    // 찜 목록을 먼저 받고, 그 캠페인 ID로 쿠폰 발급 상태를 받아 합친다
    fetchWishlist().then(async (items) => {
      const status = await fetchIssueStatus(
        items.map((item) => item.campaignId),
      );
      if (ignore) return;

      setWishes(items);
      setIssueStatus(status);
    });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <>
      {issueStatus && (
        <div className="flex flex-col gap-4 px-page pt-4 pb-6">
          <WishlistSummary
            dailyLimit={issueStatus.dailyLimit}
            dailyRemaining={issueStatus.dailyRemaining}
            title={
              issueStatus.dailyRemaining > 0
                ? '선착순 발급이 열렸어요'
                : '오늘의 발급을 모두 마쳤어요'
            }
          />
          {/* 3단계에서 찜 카드로 바꾼다 */}
          <ul className="flex flex-col gap-2 text-body-sm-mobile text-text-primary">
            {wishes.map((wish) => (
              <li key={wish.campaignId}>{wish.storeName}</li>
            ))}
          </ul>
          <p className="text-caption-mobile text-text-secondary">
            찜 취소는 가게 상세에서 할 수 있어요
          </p>
        </div>
      )}
    </>
  );
};

export default WishlistScreen;
