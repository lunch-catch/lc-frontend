export type AdminAccountRole = 'ADMIN' | 'OPERATOR';
export type AdminAccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminAccount {
  createdAt: string;
  id: string;
  name: string;
  role: AdminAccountRole;
  status: AdminAccountStatus;
}

export const initialAdminAccounts: AdminAccount[] = [
  {
    createdAt: '2026-10-01 09:00',
    id: 'ADM-001',
    name: '김관리',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
  {
    createdAt: '2026-09-30 14:20',
    id: 'ADM-002',
    name: '이운영',
    role: 'OPERATOR',
    status: 'ACTIVE',
  },
  {
    createdAt: '2026-09-28 11:10',
    id: 'ADM-003',
    name: '박점검',
    role: 'OPERATOR',
    status: 'SUSPENDED',
  },
  {
    createdAt: '2026-09-25 16:40',
    id: 'ADM-004',
    name: '최관리',
    role: 'ADMIN',
    status: 'ACTIVE',
  },
];
