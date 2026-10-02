import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import {
  fetchIssueStatus,
  issueCoupon,
  type IssueResult,
  type IssueStatusResponse,
} from '@user/api/coupon';
import {
  fetchWishlist,
  removeWish,
  restoreWish,
  type WishItem,
} from '@user/api/wishlist';
import FeedbackToast, {
  type FeedbackToastProps,
} from '@user/components/FeedbackToast/FeedbackToast';

import { formatCountdown, useOpenCountdown } from './useOpenCountdown';
import WishCard from './WishCard';
import WishlistEmpty from './WishlistEmpty';
import WishlistSkeleton from './WishlistSkeleton';
import WishlistSummary from './WishlistSummary';
import { getWishState, WISH_STATE_ORDER } from './wishState';

const TOAST_DURATION_MS = 2500;
// 되돌리기 버튼을 누를 시간을 조금 더 준다
const ACTION_TOAST_DURATION_MS = 4000;

const ISSUE_FAIL_MESSAGES: Record<Exclude<IssueResult, 'issued'>, string> = {
  soldOut: '아쉽게도 그사이 수량이 모두 소진됐어요',
  limitReached: '오늘 받을 수 있는 쿠폰을 모두 받았어요',
};

const WishlistScreen = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [issueStatus, setIssueStatus] = useState<IssueStatusResponse | null>(
    null,
  );
  // 쿠폰을 받는 중인 캠페인. 한 번에 하나씩만 받는다
  const [issuingCampaignId, setIssuingCampaignId] = useState<string | null>(
    null,
  );
  // 이 화면에서 쿠폰을 받았는지. 받았으면 맨 위 제목으로 알려준다
  const [hasIssued, setHasIssued] = useState(false);
  const [toast, setToast] = useState<FeedbackToastProps | null>(null);
  // 11:00이 되면 새로고침하지 않아도 카드가 받기로 바뀐다
  const { isOpen, remainingMs } = useOpenCountdown();

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

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(
      () => setToast(null),
      toast.action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [toast]);

  const handleIssue = async (campaignId: string) => {
    if (issuingCampaignId) return;

    setIssuingCampaignId(campaignId);

    try {
      const result = await issueCoupon(campaignId);
      // 성공이든 실패든 잔여 수량과 남은 횟수가 바뀌었을 수 있어 발급 상태를 다시 받는다
      const status = await fetchIssueStatus(
        wishes.map((wish) => wish.campaignId),
      );
      setIssueStatus(status);

      if (result === 'issued') {
        setHasIssued(true);
      } else {
        setToast({ message: ISSUE_FAIL_MESSAGES[result], tone: 'error' });
      }
    } catch {
      setToast({ message: '쿠폰 발급에 실패했어요', tone: 'error' });
    } finally {
      setIssuingCampaignId(null);
    }
  };

  // 지운 카드를 원래 자리에 다시 넣는다
  const putBack = (wish: WishItem, index: number) => {
    setWishes((current) => [
      ...current.slice(0, index),
      wish,
      ...current.slice(index),
    ]);
  };

  const handleUndoRemove = (wish: WishItem, index: number) => {
    putBack(wish, index);
    setToast(null);
    restoreWish(wish.campaignId);
  };

  // 응답을 기다리지 않고 바로 목록에서 빼서, 실수로 지웠을 때 곧바로 되돌릴 수 있게 한다
  const handleRemove = (wish: WishItem) => {
    const index = wishes.findIndex(
      (item) => item.campaignId === wish.campaignId,
    );

    setWishes((current) =>
      current.filter((item) => item.campaignId !== wish.campaignId),
    );
    setToast({
      message: '찜 목록에서 삭제했어요',
      action: {
        label: '되돌리기',
        onClick: () => handleUndoRemove(wish, index),
      },
    });

    removeWish(wish.campaignId).catch(() => {
      putBack(wish, index);
      setToast({ message: '찜을 삭제하지 못했어요', tone: 'error' });
    });
  };

  const getSummaryTitle = (dailyRemaining: number) => {
    if (hasIssued) {
      return (
        <>
          <Check
            aria-hidden="true"
            className="size-5 shrink-0 text-status-success-fg"
            strokeWidth={3}
          />
          쿠폰을 받았어요
        </>
      );
    }
    if (!isOpen) {
      return (
        // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
        <span>
          11:00 오픈까지{' '}
          <span className="text-text-brand tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </span>
      );
    }
    if (dailyRemaining === 0) return '오늘의 발급을 모두 마쳤어요';
    return '선착순 발급이 열렸어요';
  };

  // 찜마다 발급 상태를 붙이고 카드 상태를 정한 뒤, 받을 수 있는 카드가 위로 오게 정렬한다
  const getSortedEntries = ({
    campaigns,
    dailyRemaining,
  }: IssueStatusResponse) =>
    wishes
      .flatMap((wish) => {
        const status = campaigns.find(
          (campaign) => campaign.campaignId === wish.campaignId,
        );
        if (!status) return [];

        const state = getWishState({
          dailyRemaining,
          isIssued: status.isIssued,
          isOpen,
          remainingCount: status.remainingCount,
        });
        return [{ state, status, wish }];
      })
      .sort((a, b) => WISH_STATE_ORDER[a.state] - WISH_STATE_ORDER[b.state]);

  const isEmpty = issueStatus !== null && wishes.length === 0;

  return (
    // 토스트를 탭 바로 아래에 띄우기 위한 기준 영역. 마지막 찜을 지워 빈 화면이 돼도 토스트를 보여준다
    <div className="relative flex flex-1 flex-col">
      {toast && (
        <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
          <FeedbackToast {...toast} />
        </div>
      )}
      {isEmpty ? (
        <WishlistEmpty />
      ) : (
        <div className="flex flex-col gap-4 px-page pt-4 pb-6">
          {/* 요청 두 번이 차례로 끝나야 그릴 수 있어, 그동안 빈 화면 대신 회색 틀을 보여준다 */}
          {!issueStatus && (
            <>
              <WishlistSkeleton />
              <p className="sr-only" role="status">
                찜 목록을 불러오는 중이에요
              </p>
            </>
          )}
          {issueStatus && (
            <>
              <WishlistSummary
                dailyLimit={issueStatus.dailyLimit}
                dailyRemaining={issueStatus.dailyRemaining}
                showNotice={!isOpen}
                title={getSummaryTitle(issueStatus.dailyRemaining)}
              />
              <ul className="flex flex-col gap-4">
                {getSortedEntries(issueStatus).map(
                  ({ state, status, wish }) => (
                    <WishCard
                      dailyLimit={issueStatus.dailyLimit}
                      isIssueBlocked={issuingCampaignId !== null}
                      isIssuing={issuingCampaignId === wish.campaignId}
                      issueStatus={status}
                      key={wish.campaignId}
                      onIssue={() => handleIssue(wish.campaignId)}
                      onRemove={() => handleRemove(wish)}
                      state={state}
                      wish={wish}
                    />
                  ),
                )}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default WishlistScreen;
