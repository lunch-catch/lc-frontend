import { useEffect } from 'react';
import { useNavigate } from 'react-router';

import splashCoupon from '@user/assets/illustrations/splash-coupon.webp';

const SPLASH_DURATION_MS = 1500;

const SplashStep = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 뒤로 가기로 스플래시에 돌아오지 않도록 기록을 바꿔서 이동한다
    const timer = setTimeout(
      () => navigate('/login', { replace: true }),
      SPLASH_DURATION_MS,
    );

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col overflow-hidden bg-bg-brand px-page pt-9 pb-12">
      {/* 스플래시 전용 로고라 글자 스케일 대신 고정 크기를 쓴다 */}
      <h1 className="text-[58px] leading-snug font-black text-text-inverse">
        런치
        <br />
        캐치
      </h1>
      <p className="mt-5 text-body-mobile font-medium text-text-inverse">
        오늘 점심, 놓치기 전에 캐치
      </p>
      {/* 마스코트는 Figma와 같은 크기로, 문구 아래 남는 높이의 세로 가운데에 둔다 */}
      <div className="mt-8 flex flex-1 items-center justify-center">
        <div className="relative w-82.5 max-w-full">
          {/* 평평한 주황 배경에 깊이를 주고 마스코트로 시선이 가도록 뒤에 은은한 빛을 깐다 */}
          <div
            aria-hidden="true"
            className="absolute inset-[-10%] bg-radial from-text-inverse/30 to-transparent to-65%"
          />
          {/* 움직임 줄이기 설정을 켠 사용자에게는 정지된 그림을 보여준다 */}
          <img
            alt=""
            className="relative h-auto w-full animate-splash-enter motion-reduce:animate-none"
            height={255}
            src={splashCoupon}
            width={330}
          />
        </div>
      </div>
      {/* 처음 여는 사용자에게 서비스의 핵심 규칙을 알려준다. 위 문구보다 눈에 덜 띄게 작고 흐리게 둔다 */}
      <p className="mt-8 text-center text-caption-mobile font-medium text-text-inverse/80">
        매일 11시, 점심 쿠폰 선착순 오픈
      </p>
    </main>
  );
};

export default SplashStep;
