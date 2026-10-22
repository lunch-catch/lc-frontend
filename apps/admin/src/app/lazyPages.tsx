import { lazy } from 'react';

// 로그인·인증 가드는 즉시 제공하고 보호된 페이지 코드는 실제 진입 시에만 불러온다.
// lazy 정의는 렌더 밖에서 유지하고, 기존 named export를 lazy가 요구하는 default로 연결한다.
export const DashboardPage = lazy(() =>
  import('@admin/pages/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
export const CampaignManagementPage = lazy(() =>
  import('@admin/pages/CampaignManagementPage').then((module) => ({
    default: module.CampaignManagementPage,
  })),
);
export const TemplateManagementPage = lazy(() =>
  import('@admin/pages/TemplateManagementPage').then((module) => ({
    default: module.TemplateManagementPage,
  })),
);
// 생성 → 초안 주소 변경에서도 같은 컴포넌트를 사용해 대화와 편집 상태를 유지한다.
export const TemplateCreatePage = lazy(() =>
  import('@admin/pages/TemplateCreatePage').then((module) => ({
    default: module.TemplateCreatePage,
  })),
);
export const PointSettlementPage = lazy(() =>
  import('@admin/pages/PointSettlementPage').then((module) => ({
    default: module.PointSettlementPage,
  })),
);
export const MemberManagementPage = lazy(() =>
  import('@admin/pages/MemberManagementPage').then((module) => ({
    default: module.MemberManagementPage,
  })),
);
export const FraudManagementPage = lazy(() =>
  import('@admin/pages/FraudManagementPage').then((module) => ({
    default: module.FraudManagementPage,
  })),
);
export const AdminAccountManagementPage = lazy(() =>
  import('@admin/pages/AdminAccountManagementPage').then((module) => ({
    default: module.AdminAccountManagementPage,
  })),
);
