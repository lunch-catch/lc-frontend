import { NavLink, Outlet, useLocation } from 'react-router';

import TopBar from '@user/ui/TopBar/TopBar';

// 찜에서 받기, 사용까지 이어지는 순서로 둔다
const couponTabs = [
  { label: '찜 목록', to: '/coupons/wishlist' },
  { label: '사용 가능', to: '/coupons' },
  { label: '사용 내역', to: '/coupons/history' },
];

// 쿠폰함 탭 안의 화면들이 함께 쓰는 제목과 탭 줄
const CouponLayout = () => {
  const { pathname } = useLocation();
  const currentTab = couponTabs.find((tab) => tab.to === pathname);

  return (
    <>
      <TopBar title="쿠폰함" tone="page" />
      {/* 탭마다 주소가 따로 있어, 알림이나 다른 화면에서 원하는 탭으로 바로 열 수 있다 */}
      <nav
        aria-label="쿠폰함 메뉴"
        className="flex border-b border-border-subtle bg-bg-page"
      >
        {couponTabs.map((tab) => (
          <NavLink
            className={({ isActive }) =>
              `flex h-11 flex-1 flex-col items-center justify-between pt-3 text-body-sm-mobile ${
                isActive
                  ? 'font-bold text-text-primary'
                  : 'font-medium text-text-secondary'
              }`
            }
            end
            key={tab.to}
            to={tab.to}
          >
            {({ isActive }) => (
              <>
                {tab.label}
                <span
                  aria-hidden="true"
                  className={`h-0.5 w-full ${isActive ? 'bg-action-primary' : ''}`}
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {/* 쿠폰 카드 제목(h3)이 화면 제목(h1) 바로 아래로 오지 않게, 지금 탭 이름을 보이지 않는 구역 제목으로 둔다 */}
      {currentTab && <h2 className="sr-only">{currentTab.label}</h2>}
      <Outlet />
    </>
  );
};

export default CouponLayout;
