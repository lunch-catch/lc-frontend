import { Link } from 'react-router';
import { ChevronRight, Sparkle } from 'lucide-react';

import bannerBefore from '@user/assets/illustrations/banner-before.webp';
import bannerClosed from '@user/assets/illustrations/banner-closed.webp';
import bannerOpen from '@user/assets/illustrations/banner-open.webp';
import {
  formatCountdown,
  useOpenCountdown,
} from '@user/hooks/useOpenCountdown';

// 숫자 한 칸. 값이 바뀌면 key가 달라져 위에서 내려오며 바뀐다
const Digit = ({ value }: { value: string }) => (
  <span className="inline-block w-[0.62em] overflow-hidden text-center">
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

// 마스코트 둘레의 작은 장식 자리 (배너 오른쪽 기준). 상태마다 모양만 바뀌고 천천히 깜빡인다
const SPARKLE_SPOTS = [
  { className: 'top-3 right-19', delay: 0 },
  { className: 'top-2.5 right-4', delay: 0.8 },
  { className: 'right-20 bottom-3', delay: 1.4 },
  { className: 'right-3 bottom-4', delay: 0.4 },
];

const SPARKLE_SHAPES = {
  // 오픈 전: 작은 점
  before: <span className="block size-1.5 rounded-full bg-secondary-400" />,
  // 발급 중: 흩날리는 종이 조각
  open: (
    <span className="block h-2.5 w-1 rotate-45 rounded-[1px] bg-brand-500/70" />
  ),
  // 마감 뒤: 별
  closed: <Sparkle className="size-3 fill-secondary-400 text-secondary-400" />,
};

const Sparkles = ({ phase }: { phase: keyof typeof SPARKLE_SHAPES }) => (
  <>
    {SPARKLE_SPOTS.map(({ className, delay }) => (
      <span
        aria-hidden="true"
        className={`absolute animate-banner-twinkle motion-reduce:animate-none ${className}`}
        key={className}
        style={{ animationDelay: `${delay}s` }}
      >
        {SPARKLE_SHAPES[phase]}
      </span>
    ))}
  </>
);

// 탐색 맨 위의 지금 상태 안내. 오픈 전엔 카운트다운, 발급 중엔 선착순 안내, 마감 뒤엔 내일 안내
const StatusBanner = () => {
  const { isIssueClosed, isOpen, remainingMs } = useOpenCountdown();

  const phase = !isOpen ? 'before' : isIssueClosed ? 'closed' : 'open';
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
      {/* 마스코트 뒤에 은은하게 퍼지는 빛 */}
      <span
        aria-hidden="true"
        className="absolute top-1/2 right-0 size-32 -translate-y-1/2 bg-radial from-secondary-300/60 to-transparent to-70%"
      />
      <Sparkles phase={phase} />
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
