import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

import {
  type CampaignIssueStatus,
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
import mascotError from '@user/assets/illustrations/mascot-error.webp';
import { useDelayedLoading } from '@user/hooks/useDelayedLoading';
import {
  formatCountdown,
  useOpenCountdown,
} from '@user/hooks/useOpenCountdown';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import EmptyState from '@user/ui/EmptyState/EmptyState';
import FeedbackToast, {
  type FeedbackToastProps,
} from '@user/ui/FeedbackToast/FeedbackToast';
import { getWishState, WISH_STATE_ORDER } from '@user/ui/wishState';

import WishCard, { type WishCardState } from './WishCard';
import WishlistEmpty from './WishlistEmpty';
import WishlistSkeleton from './WishlistSkeleton';
import WishlistSummary from './WishlistSummary';

const TOAST_DURATION_MS = 2500;
// 되돌리기 버튼을 누를 시간을 조금 더 준다
const ACTION_TOAST_DURATION_MS = 4000;

const ISSUE_FAIL_MESSAGES: Record<Exclude<IssueResult, 'issued'>, string> = {
  soldOut: '아쉽게도 그사이 수량이 모두 소진됐어요',
  limitReached: '오늘 받을 수 있는 쿠폰을 모두 받았어요',
  alreadyIssued: '오늘 이미 받은 쿠폰이에요',
  notWished: '찜한 뒤에 받을 수 있어요',
  notOpen: '지금은 받을 수 없는 시간이에요',
};

// 받기에 성공했는데 발급 상태를 다시 받지 못하면, 받은 카드와 남은 횟수만 직접 바꾼다
// 그대로 두면 받은 카드에 받기 버튼이 남아 다시 누르게 된다
const markIssued = (
  status: IssueStatusResponse,
  campaignId: string,
): IssueStatusResponse => ({
  ...status,
  campaigns: status.campaigns.map((campaign) =>
    campaign.campaignId === campaignId
      ? { ...campaign, isIssued: true }
      : campaign,
  ),
  dailyRemaining: Math.max(0, status.dailyRemaining - 1),
});

interface WishEntry {
  state: WishCardState;
  // 발급 상태를 받지 못했거나 끝난 캠페인이면 null
  status: CampaignIssueStatus | null;
  wish: WishItem;
}

// 카드 순서. 끝난 찜은 받을 수 있는 게 없어, 11:00에 받기 버튼을 가리지 않도록 맨 아래에 모은다
// 서버는 끝난 찜을 찜한 순서에 섞어 보내고, 화면에서만 이렇게 정렬한다
const CARD_STATE_ORDER: Record<WishCardState, number> = {
  ...WISH_STATE_ORDER,
  unknown: 0,
  ended: 3,
};

// 발급 상태를 물을 찜. 끝난 캠페인은 오늘 쿠폰 이벤트가 없어 묻지 않는다
const getIssueTargets = (wishes: WishItem[]) =>
  wishes.filter((wish) => !wish.isEnded);

// 11:00 오픈과 14:00 마감이 지났는지
interface IssueTiming {
  isOpen: boolean;
  isClosed: boolean;
}

// 찜마다 발급 상태를 붙이고 카드 상태를 정한다
// 끝나지 않았는데 발급 상태가 없는 찜(오늘 쿠폰 이벤트가 없음)은 받을 수 없어 보여주지 않는다
const toEntries = (
  wishes: WishItem[],
  { campaigns, dailyRemaining }: IssueStatusResponse,
  { isClosed, isOpen }: IssueTiming,
): WishEntry[] =>
  wishes.flatMap((wish): WishEntry[] => {
    if (wish.isEnded) return [{ state: 'ended', status: null, wish }];

    const status = campaigns.find(
      (campaign) => campaign.campaignId === wish.campaignId,
    );
    if (!status) return [];

    const state = getWishState({
      dailyRemaining,
      isClosed,
      isIssued: status.isIssued,
      isOpen,
      remainingCount: status.remainingCount,
    });
    return [{ state, status, wish }];
  });

// 받을 수 있는 카드가 위로 오는 순서 (캠페인 ID 목록)
const getSortedIds = (
  wishes: WishItem[],
  issueStatus: IssueStatusResponse,
  timing: IssueTiming,
) =>
  toEntries(wishes, issueStatus, timing)
    .sort((a, b) => CARD_STATE_ORDER[a.state] - CARD_STATE_ORDER[b.state])
    .map(({ wish }) => wish.campaignId);

// loading: 불러오는 중, ready: 찜 목록을 받음, error: 찜 목록을 받지 못함
type LoadState = 'loading' | 'ready' | 'error';

const WishlistScreen = () => {
  const [wishes, setWishes] = useState<WishItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const showSkeleton = useDelayedLoading(loadState === 'loading');
  // 다시 시도할 때마다 올려서 처음부터 다시 받는다
  const [attempt, setAttempt] = useState(0);
  // 찜 목록을 받았는데 발급 상태만 받지 못했으면 null이다. 이때는 받기 버튼 없이 찜만 보여준다
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
  const { isIssueClosed, isOpen, remainingMs } = useOpenCountdown();
  const timing: IssueTiming = { isClosed: isIssueClosed, isOpen };
  // 카드 순서를 다시 정할 때를 알려 준다. 11:00 오픈과 14:00 마감 순간에 바뀐다
  const timingKey = `${isOpen}-${isIssueClosed}`;
  // 카드 순서. 화면을 열 때와 11:00 오픈 순간에만 정하고, 보는 동안은 바꾸지 않는다
  // 받기를 누른 카드가 바로 아래로 내려가면 손가락 아래로 다음 카드가 올라와
  // 받았는지 알 수 없고, 다시 누르면 원하지 않은 쿠폰을 받게 된다
  const [order, setOrder] = useState<{
    timingKey: string;
    ids: string[];
  } | null>(null);

  if (issueStatus && order?.timingKey !== timingKey) {
    setOrder({ timingKey, ids: getSortedIds(wishes, issueStatus, timing) });
  }

  useEffect(() => {
    let ignore = false;

    // 찜 목록을 먼저 받고, 그 캠페인과 가게 ID로 쿠폰 발급 상태를 받아 합친다
    // 발급 상태는 받기 버튼에만 필요해서, 받지 못해도 찜 목록은 보여준다
    const load = async () => {
      let items: WishItem[];
      try {
        items = await fetchWishlist();
      } catch {
        if (!ignore) setLoadState('error');
        return;
      }

      const status = await fetchIssueStatus(getIssueTargets(items)).catch(
        () => null,
      );
      if (ignore) return;

      setWishes(items);
      setIssueStatus(status);
      setLoadState('ready');
    };
    load();

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  const retry = () => {
    setLoadState('loading');
    setIssueStatus(null);
    setOrder(null);
    setAttempt((value) => value + 1);
  };

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

    // 발급은 발급 상태에서 받아 둔 오늘 이벤트 ID로 한다
    const current = issueStatus?.campaigns.find(
      (campaign) => campaign.campaignId === campaignId,
    );
    let result: IssueResult;
    try {
      result = await issueCoupon({
        campaignId,
        eventId: current?.eventId ?? null,
      });
    } catch {
      setToast({ message: '쿠폰 발급에 실패했어요', tone: 'error' });
      setIssuingCampaignId(null);
      return;
    }

    // 성공이든 실패든 잔여 수량과 남은 횟수가 바뀌었을 수 있어 발급 상태를 다시 받는다
    // 다시 받지 못해도 발급 결과는 그대로 알린다. 받았으면 그 카드만 받음으로 바꾼다
    try {
      setIssueStatus(await fetchIssueStatus(getIssueTargets(wishes)));
    } catch {
      if (result === 'issued') {
        setIssueStatus((status) => status && markIssued(status, campaignId));
      }
    }

    if (result === 'issued') {
      setHasIssued(true);
    } else {
      setToast({ message: ISSUE_FAIL_MESSAGES[result], tone: 'error' });
    }
    setIssuingCampaignId(null);
  };

  // 지운 카드를 원래 자리에 다시 넣는다
  // 되돌린 뒤 삭제 실패가 늦게 오면 두 번 불릴 수 있어, 이미 있으면 넣지 않는다
  const putBack = (wish: WishItem, index: number) => {
    setWishes((current) =>
      current.some((item) => item.campaignId === wish.campaignId)
        ? current
        : [...current.slice(0, index), wish, ...current.slice(index)],
    );
  };

  const handleUndoRemove = (wish: WishItem, index: number) => {
    putBack(wish, index);
    setToast(null);
    // 다시 찜하지 못했으면 서버에는 지워진 채라, 카드를 다시 빼고 알린다
    restoreWish(wish.campaignId).catch(() => {
      setWishes((current) =>
        current.filter((item) => item.campaignId !== wish.campaignId),
      );
      setToast({ message: '찜을 되돌리지 못했어요', tone: 'error' });
    });
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
      // 끝난 캠페인은 다시 찜할 수 없어 되돌리기를 두지 않는다
      action: wish.isEnded
        ? undefined
        : {
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
    if (isIssueClosed) return '오늘 발급이 끝났어요';
    if (!isOpen) {
      return (
        // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
        <span>
          쿠폰 오픈까지{' '}
          <span className="text-text-brand tabular-nums">
            {formatCountdown(remainingMs)}
          </span>
        </span>
      );
    }
    if (dailyRemaining === 0) return '오늘의 발급을 모두 마쳤어요';
    return '선착순 발급이 열렸어요';
  };

  // 정해 둔 순서대로 놓는다. 순서를 정한 뒤 다시 넣은 카드는 맨 뒤에 둔다
  // 발급 상태가 없으면 받을 수 있는지 몰라 찜한 순서 그대로 둔다. 끝난 찜은 그래도 종료로 맨 아래에 둔다
  const getOrderedEntries = (): WishEntry[] => {
    if (!issueStatus) {
      return wishes
        .map((wish): WishEntry => ({
          state: wish.isEnded ? 'ended' : 'unknown',
          status: null,
          wish,
        }))
        .sort((a, b) => CARD_STATE_ORDER[a.state] - CARD_STATE_ORDER[b.state]);
    }
    const rank = (campaignId: string) => {
      const index = order?.ids.indexOf(campaignId) ?? -1;
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    return toEntries(wishes, issueStatus, timing).sort(
      (a, b) => rank(a.wish.campaignId) - rank(b.wish.campaignId),
    );
  };

  const renderContent = () => {
    // 요청 두 번이 차례로 끝나야 그릴 수 있어, 그동안 빈 화면 대신 회색 틀을 보여준다
    // 응답이 빠르면 회색 틀이 잠깐 나왔다 사라져 번쩍이므로, 조금 기다린 뒤에만 보여준다
    if (loadState === 'loading') {
      return (
        <div className="flex flex-col gap-4 px-page pt-4 pb-6">
          {showSkeleton && <WishlistSkeleton />}
          <p className="sr-only" role="status">
            찜 목록을 불러오는 중이에요
          </p>
        </div>
      );
    }

    if (loadState === 'error') {
      return (
        <EmptyState
          description="잠시 후 다시 시도해 주세요"
          image={mascotError}
          title="찜 목록을 불러오지 못했어요"
        >
          <ActionButton onClick={retry}>다시 시도</ActionButton>
        </EmptyState>
      );
    }

    if (wishes.length === 0) return <WishlistEmpty />;

    return (
      <div className="flex flex-col gap-4 px-page pt-4 pb-6">
        {issueStatus ? (
          <WishlistSummary
            dailyLimit={issueStatus.dailyLimit}
            dailyRemaining={issueStatus.dailyRemaining}
            isClosed={isIssueClosed}
            showNotice={!isOpen}
            title={getSummaryTitle(issueStatus.dailyRemaining)}
          />
        ) : (
          // 발급 상태를 받지 못하면 받을 수 있는지 모르니, 찜은 보여주되 받기는 다시 불러온 뒤에 하게 한다
          <section
            className="flex items-center justify-between gap-3 rounded-xl bg-status-danger-bg px-4 py-3"
            role="alert"
          >
            <p className="min-w-0 text-body-sm-mobile font-medium text-status-danger-fg">
              발급 상태를 불러오지 못해
              <br />
              지금은 쿠폰을 받을 수 없어요
            </p>
            <button
              className="-my-2 shrink-0 px-2 py-2 text-body-sm-mobile font-bold text-status-danger-fg underline underline-offset-2"
              onClick={retry}
              type="button"
            >
              다시 시도
            </button>
          </section>
        )}
        <ul className="flex flex-col gap-4">
          {getOrderedEntries().map(({ state, status, wish }) => (
            <WishCard
              dailyLimit={issueStatus?.dailyLimit ?? 0}
              isIssueBlocked={issuingCampaignId !== null}
              isIssuing={issuingCampaignId === wish.campaignId}
              issueStatus={status}
              key={wish.campaignId}
              onIssue={() => handleIssue(wish.campaignId)}
              onRemove={() => handleRemove(wish)}
              state={state}
              wish={wish}
            />
          ))}
        </ul>
      </div>
    );
  };

  return (
    // 토스트를 탭 바로 아래에 띄우기 위한 기준 영역. 마지막 찜을 지워 빈 화면이 돼도 토스트를 보여준다
    <div className="relative flex flex-1 flex-col">
      {toast && (
        <div className="absolute inset-x-0 top-0 z-20 px-page pt-3">
          <FeedbackToast {...toast} />
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default WishlistScreen;
