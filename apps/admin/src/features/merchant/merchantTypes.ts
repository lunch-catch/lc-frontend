export type ApplicationStatus = 'ACTIVE' | 'ONBOARDING';

export interface StoreApplication {
  address: string;
  appliedAt: string;
  businessNumber: string;
  id: string;
  status: ApplicationStatus;
  storeName: string;
}

export interface StoreApplicationDetail {
  address: string;
  addressDetail: string;
  appliedAt: string;
  businessDays: string;
  businessLicenseRegistered: boolean;
  businessNumber: string;
  businessVerified: boolean;
  category: string;
  id: string;
  menus: { name: string; price: string }[];
  ownerName: string;
  phoneNumber: string;
  status: ApplicationStatus;
  storeName: string;
  termsAgreed: boolean;
  weekdayHours: string;
  weekendHours: string;
}
