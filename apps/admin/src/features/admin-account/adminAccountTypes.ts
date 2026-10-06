export type AdminAccountRole = 'ADMIN' | 'OPERATOR';
export type AdminAccountStatus = 'ACTIVE' | 'SUSPENDED';

export interface AdminAccount {
  createdAt: string;
  id: string;
  name: string;
  role: AdminAccountRole;
  status: AdminAccountStatus;
}
