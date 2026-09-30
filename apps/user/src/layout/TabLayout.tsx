import { Outlet, useLocation, useNavigate } from 'react-router';
import { BottomNav, type BottomNavItem } from '@repo/ui';
import { ArrowRightLeft, Compass, Ticket, User } from 'lucide-react';

const tabItems: BottomNavItem[] = [
  { icon: <ArrowRightLeft />, label: '스와이프', value: '/swipe' },
  { icon: <Compass />, label: '탐색', value: '/explore' },
  { icon: <Ticket />, label: '쿠폰함', value: '/coupons' },
  { icon: <User />, label: '마이', value: '/my' },
];

const TabLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 하위 경로(/coupons/123 등)에서도 해당 탭이 선택되도록 앞부분으로 비교한다
  const activeTab =
    tabItems.find((item) => pathname.startsWith(item.value))?.value ?? '';

  return (
    <div className="mx-auto flex min-h-dvh max-w-mobile flex-col bg-bg-page">
      {/* 하단 탭바에 내용이 가려지지 않도록 탭바 높이만큼 비워둔다 */}
      {/* 화면이 남는 높이를 채울 수 있도록 세로 flex로 둔다 */}
      <main className="flex flex-1 flex-col pb-[calc(82px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomNav
        className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-mobile"
        items={tabItems}
        onValueChange={(path) => navigate(path)}
        value={activeTab}
      />
    </div>
  );
};

export default TabLayout;
