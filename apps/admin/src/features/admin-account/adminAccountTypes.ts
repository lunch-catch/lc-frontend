import type { AdminAccountRole } from '@admin/api/adminAccounts';

export interface AdminAccountForm {
  id: string;
  name: string;
  password: string;
  passwordConfirmation: string;
  role: AdminAccountRole;
}

export interface AdminAccountFormErrors {
  id?: string;
  name?: string;
  password?: string;
  passwordConfirmation?: string;
}
