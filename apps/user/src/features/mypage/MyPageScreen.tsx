import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

import { fetchMyProfile } from '@user/api/member';
import Card from '@user/components/Card/Card';
import TopBar from '@user/components/TopBar/TopBar';

import ProfileSummary from './ProfileSummary';
import { useLoad } from './useLoad';

// 찜 목록과 사용 내역은 쿠폰함 탭에 있어 새 화면 없이 그 탭으로 보낸다
// 알림·위치 동의, 화면 모드, 로그아웃처럼 가끔 쓰는 것은 설정 화면에 모은다
const menuItems = [
  { label: '찜 목록', to: '/coupons/wishlist' },
  { label: '쿠폰 사용 내역', to: '/coupons/history' },
  { label: '위치 설정', to: '/my/location' },
  { label: '설정', to: '/my/settings' },
];

// 마이 탭. 프로필과 쿠폰 요약, 바로가기
const MyPageScreen = () => {
  const profile = useLoad(fetchMyProfile);

  return (
    <div className="flex flex-1 flex-col">
      <TopBar title="마이페이지" tone="page" />
      <div className="flex flex-1 flex-col gap-3 px-page pt-2 pb-6">
        <ProfileSummary profile={profile} />
        <nav aria-label="바로가기">
          <Card
            as="ul"
            className="divide-y divide-border-subtle overflow-hidden"
          >
            {menuItems.map(({ label, to }) => (
              <li key={to}>
                <Link
                  className="flex h-13 items-center justify-between px-4 text-body-sm-mobile font-medium text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
                  to={to}
                >
                  {label}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 text-text-tertiary"
                  />
                </Link>
              </li>
            ))}
          </Card>
        </nav>
      </div>
    </div>
  );
};

export default MyPageScreen;
