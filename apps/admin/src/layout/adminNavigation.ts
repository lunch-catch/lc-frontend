export const adminNavigationPaths: Record<string, string> = {
  dashboard: '/dashboard',
  campaign: '/campaigns',
  template: '/templates',
  settlement: '/settlements',
  member: '/members',
  fraud: '/fraud',
  review: '/reviews',
  account: '/admin-accounts',
};

// 작성·상세 같은 하위 경로도 상위 메뉴로 표시하며 경로 구분자로 접두어 충돌을 막는다.
export const getActiveAdminItem = (pathname: string) =>
  Object.entries(adminNavigationPaths).find(
    ([, path]) => pathname === path || pathname.startsWith(`${path}/`),
  )?.[0] ?? 'dashboard';
