import type { AdminAccountRole } from '@admin/api/adminAccounts';

export const adminAccountRoleOptions: {
  label: string;
  value: AdminAccountRole;
}[] = [
  { label: '관리자', value: 'ADMIN' },
  { label: '최고 관리자', value: 'SUPER_ADMIN' },
];
