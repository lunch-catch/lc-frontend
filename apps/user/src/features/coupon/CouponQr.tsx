import { type ReactNode, useEffect, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

import { getNow, getTodayAt } from '@user/api/clock';
import {
  type Coupon,
  QR_TOKEN_LIFETIME_MS,
  type QrToken,
} from '@user/api/coupon';

import { getQrState, type QrState } from './qrState';
import { useQrToken } from './useQrToken';

const TICK_MS = 1000;
// 계산대에서 스캔이 잘 되도록 QR을 화면에서 가장 크게 둔다 (테두리 안쪽 크기)
const QR_SIZE = 278;
// 스캐너가 QR 경계를 찾을 수 있도록 둘레에 QR 칸 4개만큼 빈 여백을 둔다 (QR 표준 권장값)
const QR_QUIET_ZONE = 4;

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

// 남은 시간을 00:52 모양으로 바꾼다. 마지막 1초까지 보이도록 올림한다
const formatSeconds = (remainingMs: number) => {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const formatDateTime = (isoString: string) =>
  new Date(isoString).toLocaleString('ko-KR', {
    day: 'numeric',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: 'long',
  });

interface QrPanelProps {
  coupon: Coupon;
  state: QrState;
  token: QrToken | null;
  now: number;
}

// 상태에 따라 QR이나 큰 안내, 그리고 짧은 설명을 바꿔 보여주는 영역
const QrPanel = ({ coupon, now, state, token }: QrPanelProps) => {
  // 숫자 폭을 같게 해 1초마다 글자가 좌우로 흔들리지 않게 한다
  // 토큰을 받은 순간과 화면 시계가 1초 안쪽으로 어긋날 수 있어 60초를 넘지 않게 한다
  const remaining = token && (
    <span className="font-bold tabular-nums">
      {formatSeconds(Math.min(token.expiresAt - now, QR_TOKEN_LIFETIME_MS))}
    </span>
  );
  const isUrgent = state === 'urgent';

  const contentByState: Record<
    QrState,
    { title: string; value?: string; description: ReactNode }
  > = {
    active: {
      title: '직원에게 보여주세요',
      description: <>{remaining} 뒤 새 QR로 바뀌어요</>,
    },
    urgent: {
      title: '곧 새 QR로 바뀌어요',
      description: <>{remaining} 뒤 자동으로 바뀌어요</>,
    },
    refreshing: {
      title: 'QR 갱신 중',
      description: '새 QR을 불러오고 있어요',
    },
    offline: {
      title: '인터넷 연결 없음',
      description:
        token && token.expiresAt > now ? (
          <>마지막 QR · {remaining} 남음, 연결되면 새 QR을 받아요</>
        ) : (
          '연결되면 새 QR을 받아요'
        ),
    },
    beforeUse: {
      title: '사용 시작 전',
      value: coupon.usableFrom,
      description: `${coupon.usableFrom}부터 QR을 볼 수 있어요`,
    },
    used: {
      title: '사용 완료!',
      description: coupon.usedAt
        ? `${formatDateTime(coupon.usedAt)} 사용 · 다시 사용할 수 없어요`
        : '사용한 쿠폰은 다시 사용할 수 없어요',
    },
    expired: {
      title: '사용 시간이 끝났어요',
      value: '만료',
      description: '쿠폰함에서 다른 쿠폰을 확인해 주세요',
    },
  };
  const content = contentByState[state];
  const showsQr =
    state === 'active' ||
    state === 'urgent' ||
    state === 'refreshing' ||
    state === 'offline';

  return (
    // QR이 없는 상태에서도 시트 높이가 크게 변하지 않도록 최소 높이를 잡는다
    <div
      className={`flex min-h-84 flex-col items-center justify-center gap-3 rounded-xl p-4 text-center transition-colors ${
        isUrgent ? 'bg-surface-brand text-text-brand' : 'text-text-primary'
      }`}
    >
      {state === 'used' && (
        <CircleCheck
          aria-hidden="true"
          className="size-12 text-status-success-fg"
        />
      )}
      <p className="text-h3-mobile font-bold">{content.title}</p>
      {content.value && (
        <p
          className={`text-h1 font-bold tabular-nums ${
            state === 'expired' ? 'text-text-secondary' : ''
          }`}
        >
          {content.value}
        </p>
      )}
      {showsQr && (
        <div className="flex size-70 items-center justify-center overflow-hidden rounded-xl border border-border-subtle bg-white">
          {token && state !== 'refreshing' ? (
            <QRCodeSVG
              // 연결이 끊긴 동안에는 아직 쓸 수 있는 QR인지 알 수 없어 흐리게 보여준다
              className={state === 'offline' ? 'opacity-30 blur-[2px]' : ''}
              marginSize={QR_QUIET_ZONE}
              size={QR_SIZE}
              title="쿠폰 QR 코드"
              value={token.value}
            />
          ) : (
            <div
              aria-hidden="true"
              className="size-56 animate-pulse rounded-md bg-surface-subtle motion-reduce:animate-none"
            />
          )}
        </div>
      )}
      <p
        className={`text-caption-mobile ${isUrgent ? '' : 'text-text-secondary'}`}
      >
        {content.description}
      </p>
    </div>
  );
};

interface CouponQrProps {
  coupon: Coupon;
}

// 매장에서 직원에게 보여주는 쿠폰 QR. 쿠폰함에서 시트로 띄운다
const CouponQr = ({ coupon }: CouponQrProps) => {
  const [now, setNow] = useState(getNow);

  // 남은 시간과 사용 시작·만료 시각을 1초마다 다시 확인한다
  useEffect(() => {
    const timer = setInterval(() => setNow(getNow()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const canShowQr =
    coupon.status === 'available' &&
    now >= getTodayAt(coupon.usableFrom, now) &&
    now < Date.parse(coupon.expiresAt);
  const { isOnline, token } = useQrToken(coupon.issueId, canShowQr, now);
  const state = getQrState({ coupon, isOnline, now, token });

  return (
    // 작은 화면에서 시트가 화면을 넘지 않도록 내용만 스크롤한다
    <div className="flex max-h-[75dvh] flex-col gap-3 overflow-y-auto">
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body-mobile font-bold text-text-primary">
            {coupon.storeName}
          </p>
          <p className="truncate text-caption-mobile text-text-secondary">
            {coupon.offerTitle}
          </p>
        </div>
        <p className="flex shrink-0 flex-col items-end">
          <del className="text-caption-mobile text-text-secondary">
            {formatPrice(coupon.originalPrice)}
          </del>
          <strong className="text-body-mobile font-bold text-text-primary">
            {formatPrice(coupon.salePrice)}
          </strong>
        </p>
      </div>
      <QrPanel coupon={coupon} now={now} state={state} token={token} />
      <p className="text-center text-caption-mobile font-medium text-text-brand">
        오늘 사용 시간 {coupon.usableFrom}–{coupon.usableTo}
      </p>
    </div>
  );
};

export default CouponQr;
