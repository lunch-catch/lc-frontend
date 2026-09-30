import { createBrowserRouter, Navigate, Outlet } from 'react-router';

import { OnboardingProvider } from '@user/features/onboarding/OnboardingProvider';
import StackLayout from '@user/layout/StackLayout';
import TabLayout from '@user/layout/TabLayout';
import CouponPage from '@user/pages/CouponPage';
import ExplorePage from '@user/pages/ExplorePage';
import MyPage from '@user/pages/MyPage';
import OnboardingConsentPage from '@user/pages/OnboardingConsentPage';
import OnboardingPersonalizationPage from '@user/pages/OnboardingPersonalizationPage';
import SplashPage from '@user/pages/SplashPage';
import SwipePage from '@user/pages/SwipePage';

export const router = createBrowserRouter([
  { path: '/', element: <SplashPage /> },
  {
    element: <TabLayout />,
    children: [
      { path: '/swipe', element: <SwipePage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/coupons', element: <CouponPage /> },
      { path: '/my', element: <MyPage /> },
    ],
  },
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
  // 로그인 화면이 생기기 전까지는 없는 주소를 스와이프 탭으로 보낸다
  { path: '*', element: <Navigate replace to="/swipe" /> },
]);
