import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

import bannerBefore from '@user/assets/illustrations/banner-before.webp';
import bannerClosed from '@user/assets/illustrations/banner-closed.webp';
import bannerOpen from '@user/assets/illustrations/banner-open.webp';
import {
  formatCountdown,
  useOpenCountdown,
} from '@user/hooks/useOpenCountdown';

// 숫자 한 칸. 값이 바뀌면 key가 달라져 위에서 내려오며 바뀐다
const Digit = ({ value }: { value: string }) => (
  <span className="inline-block w-[0.62em] text-center">
    <span
      className="inline-block animate-digit-roll motion-reduce:animate-none"
      key={value}
    >
      {value}
    </span>
  </span>
);

const Countdown = ({ remainingMs }: { remainingMs: number }) => {
  const text = formatCountdown(remainingMs);

  return (
    // 매초 읽어 주지 않도록 시간 전체를 하나의 이미지 글처럼 알린다
    <span aria-label={`오픈까지 ${text}`} className="tabular-nums" role="img">
      {text.split('').map((char, index) =>
        char === ':' ? (
          <span aria-hidden="true" key={index}>
            :
          </span>
        ) : (
          <span aria-hidden="true" key={index}>
            <Digit value={char} />
          </span>
        ),
      )}
    </span>
  );
};

// 탐색 맨 위의 지금 상태 안내. 오픈 전엔 카운트다운, 발급 중엔 선착순 안내, 마감 뒤엔 내일 안내
const StatusBanner = () => {
  const { isIssueClosed, isOpen, remainingMs } = useOpenCountdown();

  const content = !isOpen
    ? {
        title: '쿠폰 오픈까지',
        body: <Countdown remainingMs={remainingMs} />,
        image: bannerBefore,
        to: '/coupons/wishlist',
      }
    : isIssueClosed
      ? {
          title: '오늘 발급이 끝났어요',
          body: '내일 11:00에 다시 만나요',
          image: bannerClosed,
          to: '/swipe',
        }
      : {
          title: '선착순 발급 중',
          body: '찜한 쿠폰, 지금 받아가세요',
          image: bannerOpen,
          to: '/coupons/wishlist',
        };

  return (
    <Link
      className="relative flex h-20 items-center justify-between overflow-hidden rounded-2xl border border-secondary-200 bg-secondary-100 px-4 active:bg-secondary-200 focus-visible:outline-2 focus-visible:outline-action-primary"
      to={content.to}
    >
      <div className="relative flex flex-col gap-0.5">
        <p className="flex items-center gap-1.5 text-caption-mobile font-medium text-text-secondary">
          {isOpen && !isIssueClosed && (
            <span
              aria-hidden="true"
              className="size-1.5 animate-caret-blink rounded-full bg-brand-500 motion-reduce:animate-none"
            />
          )}
          {content.title}
        </p>
        {/* 누를 수 있다는 표시로 문구 끝에 작은 화살표를 둔다 */}
        <p className="flex items-center gap-0.5 text-body-mobile font-black text-secondary-800">
          {content.body}
          <ChevronRight
            aria-hidden="true"
            className="size-4 text-secondary-600"
          />
        </p>
      </div>
      <img
        alt=""
        className="relative size-14 object-contain"
        height={56}
        src={content.image}
        width={56}
      />
    </Link>
  );
};

export default StatusBanner;
