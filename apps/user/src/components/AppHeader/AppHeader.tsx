import { Link } from 'react-router';
import { Bell, MapPin } from 'lucide-react';

import Wordmark from '@user/components/Wordmark/Wordmark';

export interface AppHeaderProps {
  locationName: string;
  // 넘기면 찜 목록 옆에 개수를 보여준다
  wishCount?: number;
}

// 스와이프, 탐색 탭 상단의 로고, 현재 위치, 찜 목록, 알림
const AppHeader = ({ locationName, wishCount = 0 }: AppHeaderProps) => {
  return (
    <header className="flex items-center justify-between bg-bg-page px-page py-1.5">
      <div>
        <Wordmark size="sm" />
        <p className="mt-0.5 flex items-center gap-1 text-caption-mobile text-text-secondary">
          <MapPin aria-hidden="true" className="size-3" />
          {locationName}
        </p>
      </div>
      <nav aria-label="바로가기" className="flex items-center gap-1">
        <Link
          aria-label={wishCount > 0 ? `찜 목록 ${wishCount}개` : undefined}
          className="flex h-11 items-center gap-1 px-1.5 text-body-sm-mobile font-bold text-text-secondary"
          to="/wishlist"
        >
          찜 목록
          {wishCount > 0 && (
            // 개수가 바뀔 때마다 key가 바뀌어 튀는 움직임이 다시 재생된다
            <span
              className="flex h-5 min-w-5 animate-count-bump items-center justify-center rounded-full bg-action-primary px-1.5 text-caption-mobile text-text-inverse motion-reduce:animate-none"
              key={wishCount}
            >
              {wishCount}
            </span>
          )}
        </Link>
        <Link
          aria-label="알림"
          className="flex size-11 items-center justify-center text-text-primary"
          to="/notifications"
        >
          <Bell aria-hidden="true" className="size-5" />
        </Link>
      </nav>
    </header>
  );
};

export default AppHeader;
