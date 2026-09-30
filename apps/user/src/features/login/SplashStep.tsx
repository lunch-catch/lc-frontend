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
    <main className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-brand px-page pt-9">
      {/* 스플래시 전용 로고라 글자 스케일 대신 고정 크기를 쓴다 */}
      <h1 className="text-[58px] leading-snug font-black text-text-inverse">
        런치
        <br />
        캐치
      </h1>
      <p className="mt-5 text-body-mobile font-medium text-text-inverse">
        오늘 점심, 놓치기 전에 캐치
      </p>
      {/* 움직임 줄이기 설정을 켠 사용자에게는 정지된 그림을 보여준다 */}
      <img
        alt=""
        className="mx-auto mt-24 h-auto max-w-full animate-splash-enter motion-reduce:animate-none"
        height={255}
        src={splashCoupon}
        width={330}
      />
    </main>
  );
};

export default SplashStep;
