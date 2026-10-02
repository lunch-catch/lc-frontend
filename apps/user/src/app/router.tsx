import { createBrowserRouter, Navigate, Outlet } from 'react-router';

import RequireAuth from '@user/auth/RequireAuth';
import { OnboardingProvider } from '@user/features/onboarding/OnboardingProvider';
import CouponLayout from '@user/layout/CouponLayout';
import StackLayout from '@user/layout/StackLayout';
import TabLayout from '@user/layout/TabLayout';
import CouponHistoryPage from '@user/pages/CouponHistoryPage';
import CouponPage from '@user/pages/CouponPage';
import CouponQrPage from '@user/pages/CouponQrPage';
import ExplorePage from '@user/pages/ExplorePage';
import LoginPage from '@user/pages/LoginPage';
import MyPage from '@user/pages/MyPage';
import OnboardingConsentPage from '@user/pages/OnboardingConsentPage';
import OnboardingPersonalizationPage from '@user/pages/OnboardingPersonalizationPage';
import SplashPage from '@user/pages/SplashPage';
import SwipePage from '@user/pages/SwipePage';
import WishlistPage from '@user/pages/WishlistPage';

export const router = createBrowserRouter([
  {
    element: <RequireAuth access="guest" />,
    children: [
      { path: '/', element: <SplashPage /> },
      { path: '/login', element: <LoginPage /> },
    ],
  },
  {
    element: <RequireAuth access="onboarding" />,
    children: [
      {
        element: <StackLayout />,
        children: [
          {
            path: '/onboarding',
            element: (
              <OnboardingProvider>
                <Outlet />
              </OnboardingProvider>
            ),
            children: [
              { index: true, element: <Navigate replace to="consent" /> },
              { path: 'consent', element: <OnboardingConsentPage /> },
              {
                path: 'personalization',
                element: <OnboardingPersonalizationPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth access="member" />,
    children: [
      {
        element: <TabLayout />,
        children: [
          { path: '/swipe', element: <SwipePage /> },
          { path: '/explore', element: <ExplorePage /> },
          {
            // 쿠폰함은 찜 목록, 사용 가능, 사용 내역 세 탭으로 나뉜다
            path: '/coupons',
            element: <CouponLayout />,
            children: [
              { index: true, element: <CouponPage /> },
              { path: 'wishlist', element: <WishlistPage /> },
              { path: 'history', element: <CouponHistoryPage /> },
            ],
          },
          { path: '/my', element: <MyPage /> },
        ],
      },
      {
        // 하단 탭바 없이 뒤로 가기로 돌아오는 화면
        element: <StackLayout />,
        children: [{ path: '/coupons/:issueId/qr', element: <CouponQrPage /> }],
      },
    ],
  },
  // 없는 주소는 첫 화면으로 보내고, RequireAuth가 상태에 맞는 화면으로 다시 보낸다
  { path: '*', element: <Navigate replace to="/" /> },
]);
