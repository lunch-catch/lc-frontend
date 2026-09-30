import { Link } from 'react-router';
import { Bell, MapPin } from 'lucide-react';

import Wordmark from '@user/components/Wordmark/Wordmark';

export interface AppHeaderProps {
  locationName: string;
}

// 스와이프, 탐색 탭 상단의 로고, 현재 위치, 찜 목록, 알림
const AppHeader = ({ locationName }: AppHeaderProps) => {
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
          className="flex h-11 items-center px-1.5 text-body-sm-mobile font-bold text-text-secondary"
          to="/wishlist"
        >
          찜 목록
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
