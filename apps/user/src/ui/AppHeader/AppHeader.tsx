import { Link } from 'react-router';
import { ChevronRight, MapPin } from 'lucide-react';

import Wordmark from '@user/ui/Wordmark/Wordmark';

export interface AppHeaderProps {
  // 내 위치 문구. 불러오는 중이면 비워 두고 자리만 차지한다
  locationName?: string;
  // 넘기면 찜 목록 옆에 개수를 보여준다
  wishCount?: number;
}

// 스와이프, 탐색 탭 상단의 로고, 현재 위치, 찜 목록
const AppHeader = ({ locationName, wishCount = 0 }: AppHeaderProps) => {
  return (
    <header className="bg-bg-page px-page pt-1.5 pb-1">
      {/* 로고는 찜 목록과 같은 줄에 두고 위치는 그 아래 줄에 둔다 */}
      <div className="flex items-center justify-between">
        {/* 로고를 누르면 홈(오늘 점심 탭)으로 간다. 스플래시인 /로 보내지 않는다 */}
        <Link
          aria-label="런치캐치 홈"
          className="flex h-11 items-center"
          to="/swipe"
        >
          <Wordmark size="sm" />
        </Link>
        <nav aria-label="바로가기" className="flex items-center gap-1">
          <Link
            aria-label={wishCount > 0 ? `찜 목록 ${wishCount}개` : undefined}
            className="flex h-11 items-center gap-1 px-1.5 text-body-sm-mobile font-bold text-text-secondary"
            to="/coupons/wishlist"
          >
            찜 목록
            {wishCount > 0 && (
              // 배경 없이 주황색 숫자만 두어 헤더를 가볍게 유지한다
              // 개수가 바뀔 때마다 key가 바뀌어 튀는 움직임이 다시 재생된다
              <span
                className="inline-block animate-count-bump text-text-brand tabular-nums motion-reduce:animate-none"
                key={wishCount}
              >
                {wishCount}
              </span>
            )}
          </Link>
        </nav>
      </div>
      {/* 위치를 누르면 위치 설정으로 간다 */}
      <Link
        aria-label={locationName ? `위치 설정, ${locationName}` : '위치 설정'}
        className="flex w-fit max-w-full items-center gap-1 py-1 text-body-sm-mobile text-text-secondary"
        to="/my/location"
      >
        <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{locationName ?? '\u00a0'}</span>
        {locationName && (
          <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
        )}
      </Link>
    </header>
  );
};

export default AppHeader;
