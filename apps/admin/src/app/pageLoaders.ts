// 선행 다운로드와 React.lazy가 같은 로더를 공유해 페이지별 import 경로를 한 곳에 둔다.
export const loadDashboardPage = () =>
  import('@admin/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  }));
export const loadCampaignManagementPage = () =>
  import('@admin/pages/CampaignManagementPage').then((module) => ({
    default: module.CampaignManagementPage,
  }));
export const loadTemplateManagementPage = () =>
  import('@admin/pages/TemplateManagementPage').then((module) => ({
    default: module.TemplateManagementPage,
  }));
export const loadTemplateCreatePage = () =>
  import('@admin/pages/TemplateCreatePage').then((module) => ({
    default: module.TemplateCreatePage,
  }));
export const loadPointSettlementPage = () =>
  import('@admin/pages/PointSettlementPage').then((module) => ({
    default: module.PointSettlementPage,
  }));
export const loadMemberManagementPage = () =>
  import('@admin/pages/MemberManagementPage').then((module) => ({
    default: module.MemberManagementPage,
  }));
export const loadFraudManagementPage = () =>
  import('@admin/pages/FraudManagementPage').then((module) => ({
    default: module.FraudManagementPage,
  }));
export const loadAdminAccountManagementPage = () =>
  import('@admin/pages/AdminAccountManagementPage').then((module) => ({
    default: module.AdminAccountManagementPage,
  }));
/** 인증 복원과 현재 주소의 코드 다운로드를 병렬로 시작한다. 데이터 요청은 기존 인증 가드 뒤에서 실행한다. */
export const preloadAdminPage = (
  pathname: string,
): Promise<unknown> | undefined => {
  if (pathname === '/' || pathname === '/dashboard') return loadDashboardPage();
  if (pathname === '/campaigns') return loadCampaignManagementPage();
  if (pathname === '/templates') return loadTemplateManagementPage();
  if (pathname.startsWith('/templates/')) return loadTemplateCreatePage();
  if (pathname === '/settlements') return loadPointSettlementPage();
  if (pathname === '/members') return loadMemberManagementPage();
  if (pathname === '/fraud') return loadFraudManagementPage();
  if (pathname === '/admin-accounts') return loadAdminAccountManagementPage();
};
