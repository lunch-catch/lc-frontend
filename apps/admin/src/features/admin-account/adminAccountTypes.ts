export type AdminAccountRole = 'ADMIN' | 'SUPER_ADMIN';

export interface IssuedAdminAccount {
  loginId: string;
  name: string;
  role: AdminAccountRole;
}

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
