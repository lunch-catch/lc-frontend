import { NavLink, Outlet } from 'react-router';

import TopBar from '@user/components/TopBar/TopBar';

// 찜에서 받기, 사용까지 이어지는 순서로 둔다
const couponTabs = [
  { label: '찜 목록', to: '/coupons/wishlist' },
  { label: '사용 가능', to: '/coupons' },
  { label: '사용 내역', to: '/coupons/history' },
];

// 쿠폰함 탭 안의 화면들이 함께 쓰는 제목과 탭 줄
const CouponLayout = () => {
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
              `flex h-11 flex-1 flex-col items-center justify-between pt-3 text-body-mobile ${
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
      <Outlet />
    </>
  );
};

export default CouponLayout;
