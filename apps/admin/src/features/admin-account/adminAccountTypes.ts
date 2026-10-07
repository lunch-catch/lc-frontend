export type AdminAccountRole = 'ADMIN' | 'SUPER_ADMIN';
export type AdminAccountStatus = 'ACTIVE' | 'DELETED';

export interface AdminAccount {
  createdAt: string;
  id: string;
  name: string;
  role: AdminAccountRole;
  status: AdminAccountStatus;
}
