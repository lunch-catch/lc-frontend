import type { LucideIcon } from 'lucide-react';
import { Percent, Sparkles, Ticket, UtensilsCrossed } from 'lucide-react';

import loginDiscover from '@user/assets/illustrations/login-discover.webp';

import { MASCOT_DELAY_MS } from './loginIntro';

// 마스코트 둘레에 흩어 두는 작은 장식. 점심과 쿠폰이라는 서비스를 말없이 알려 준다
// 위치는 마스코트를 놓는 정사각형 틀(236px) 안의 비율이고, 마스코트의 손과 도시락을 가리지 않는 가장자리에 둔다
// 각 장식은 시작 시각을 달리해 같이 오르내리지 않는다
const DECORATIONS: {
  icon: LucideIcon;
  // 틀 안에서의 위치(%). 가로는 left, 세로는 top 기준이다
  left: string;
  top: string;
  size: string;
  rotate: number;
  // 둥실거림이 시작하는 시각을 어긋나게 하는 값(ms)
  floatDelay: number;
}[] = [
  {
    icon: Ticket,
    left: '76%',
    top: '6%',
    size: 'size-7',
    rotate: 14,
    floatDelay: 0,
  },
  {
    icon: Sparkles,
    left: '10%',
    top: '8%',
    size: 'size-5',
    rotate: -8,
    floatDelay: -900,
  },
  {
    icon: UtensilsCrossed,
    left: '4%',
    top: '66%',
    size: 'size-6',
    rotate: -12,
    floatDelay: -1700,
  },
  {
    icon: Percent,
    left: '84%',
    top: '62%',
    size: 'size-6',
    rotate: 10,
    floatDelay: -2400,
  },
];

// 장식이 나타나기 시작하는 시각(ms). 마스코트가 나타난 뒤에 이어서 나온다
const DECORATION_DELAY_MS = MASCOT_DELAY_MS + 350;

interface LoginMascotProps {
  // true면 첫 등장 순서(제목 타이핑 뒤)를 기다리지 않고 바로 보여준다
  skipIntro: boolean;
}

// 로그인 화면의 마스코트. 뒤에 은은한 빛, 발밑 그림자, 둘레의 작은 장식으로 빈 바탕이 휑하지 않게 한다 (스플래시의 빛과 같은 언어)
// 모든 움직임은 움직임 줄이기를 켠 사용자에게는 멈춘다
const LoginMascot = ({ skipIntro }: LoginMascotProps) => {
  const delay = (ms: number) =>
    skipIntro ? undefined : { animationDelay: `${ms}ms` };

  return (
    <div aria-hidden="true" className="relative size-59">
      {/* 마스코트 뒤의 연한 주황 빛. 가장자리가 번져서 사라진다 */}
      <div
        className="absolute inset-0 animate-login-fade rounded-full bg-radial from-brand-200/70 to-transparent to-65% motion-reduce:animate-none"
        style={delay(MASCOT_DELAY_MS - 200)}
      />
      {DECORATIONS.map(
        ({ floatDelay, icon: Icon, left, rotate, size, top }, index) => (
          <span
            className="absolute animate-login-fade motion-reduce:animate-none"
            key={index}
            style={{
              left,
              top,
              transform: `rotate(${rotate}deg)`,
              ...delay(DECORATION_DELAY_MS + index * 120),
            }}
          >
            <Icon
              className={`${size} animate-login-deco text-brand-400/70 motion-reduce:animate-none`}
              style={{ animationDelay: `${floatDelay}ms` }}
              strokeWidth={2.2}
            />
          </span>
        ),
      )}
      {/* 마스코트와 그림자. 마스코트는 떠오르며 나타나고 둥실거리며, 그림자는 같은 주기로 작아졌다 커진다 */}
      <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center">
        <div
          className="relative animate-login-enter motion-reduce:animate-none"
          style={delay(MASCOT_DELAY_MS)}
        >
          <div className="absolute -bottom-0.5 left-1/2 h-3 w-21 -translate-x-1/2 animate-login-shadow rounded-full bg-black/10 blur-[2px] motion-reduce:animate-none" />
          <img
            alt=""
            className="relative h-auto max-w-full animate-login-float motion-reduce:animate-none"
            height={150}
            src={loginDiscover}
            width={150}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginMascot;
