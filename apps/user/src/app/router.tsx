import { createBrowserRouter, Navigate } from 'react-router';

import TabLayout from '@user/layout/TabLayout';
import CouponPage from '@user/pages/CouponPage';
import ExplorePage from '@user/pages/ExplorePage';
import MyPage from '@user/pages/MyPage';
import SwipePage from '@user/pages/SwipePage';

export const router = createBrowserRouter([
  {
    element: <TabLayout />,
    children: [
      { path: '/swipe', element: <SwipePage /> },
      { path: '/explore', element: <ExplorePage /> },
      { path: '/coupons', element: <CouponPage /> },
      { path: '/my', element: <MyPage /> },
    ],
  },
  // 로그인, 온보딩 화면이 생기기 전까지는 첫 화면을 스와이프 탭으로 보낸다
  { path: '*', element: <Navigate replace to="/swipe" /> },
]);
