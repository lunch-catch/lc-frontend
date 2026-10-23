import { Link } from 'react-router';
import { ChevronRight, Heart, MapPin, Settings, Ticket } from 'lucide-react';

import { hasLocation } from '@user/api/location';
import { fetchMyProfile } from '@user/api/member';
import { getLocationLabel, useMyLocation } from '@user/hooks/useMyLocation';
import Card from '@user/ui/Card/Card';
import TopBar from '@user/ui/TopBar/TopBar';

import ProfileSummary from './ProfileSummary';
import { useLoad } from './useLoad';

// 마이 탭. 프로필과 아낀 금액, 바로가기
// 카드와 소제목을 여럿 두면 무거워 보여서, 바로가기는 아이콘이 붙은 목록 하나로 둔다
// 위치 동의, 화면 모드, 로그아웃처럼 가끔 쓰는 것은 설정 화면에 모은다
const MyPageScreen = () => {
  const profile = useLoad(fetchMyProfile);
  const myLocation = useMyLocation();
  // 위치 설정 오른쪽에 지금 기준 위치를 보여줘, 들어가지 않아도 어디로 잡혀 있는지 알 수 있게 한다
  const locationValue =
    myLocation && hasLocation(myLocation)
      ? getLocationLabel(myLocation)
      : myLocation
        ? '설정 안 함'
        : null;

  const menuItems = [
    // 찜 목록과 사용 내역은 쿠폰함 탭에도 있지만, 내 기록을 보다 바로 넘어가도록 둔다
    { Icon: Heart, label: '찜 목록', to: '/coupons/wishlist', value: null },
    {
      Icon: Ticket,
      label: '쿠폰 사용 내역',
      to: '/coupons/history',
      value: null,
    },
    {
      Icon: MapPin,
      label: '위치 설정',
      to: '/my/location',
      value: locationValue,
    },
    { Icon: Settings, label: '설정', to: '/my/settings', value: null },
  ];

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
            {menuItems.map(({ Icon, label, to, value }) => (
              <li key={to}>
                <Link
                  className="flex h-12 items-center gap-3 px-4 active:bg-surface-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-action-primary"
                  to={to}
                >
                  <Icon
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-text-secondary"
                  />
                  <span className="flex-1 text-body-sm-mobile font-medium text-text-primary">
                    {label}
                  </span>
                  {value && (
                    <span className="max-w-32 truncate text-caption-mobile text-text-secondary">
                      {value}
                    </span>
                  )}
                  <ChevronRight
                    aria-hidden="true"
                    className="size-4.5 shrink-0 text-text-tertiary"
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
