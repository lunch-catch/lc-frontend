import type {
  StoreApplication,
  StoreApplicationDetail,
} from '@admin/features/merchant/merchantTypes';

const stores = [
  '한상차림',
  '오늘의 파스타',
  '도시락 연구소',
  '미소 카레',
  '정성 한끼',
  '오후 식당',
  '바른 덮밥',
  '식탁 위의 봄',
  '한입 샌드',
  '매일 국밥',
  '모락모락 김밥',
  '골목 쌀국수',
];

const businessNumbers = [
  '123-45-67890',
  '234-56-78901',
  '345-67-89012',
  '456-78-90123',
  '567-89-01234',
  '678-90-12345',
  '789-01-23456',
  '890-12-34567',
  '901-23-45678',
  '012-34-56789',
  '135-79-24680',
  '246-80-13579',
];

export const mockStoreApplications: StoreApplication[] = stores.map(
  (storeName, index) => ({
    address: `서울특별시 강남구 테헤란로 ${152 + index * 2}`,
    appliedAt: `2026.09.${String(29 - index).padStart(2, '0')}`,
    businessNumber: businessNumbers[index],
    id: `APP-${String(12 - index).padStart(3, '0')}`,
    status: index % 2 === 0 ? 'ONBOARDING' : 'ACTIVE',
    storeName,
  }),
);

export const mockStoreApplicationDetail: Omit<
  StoreApplicationDetail,
  'address' | 'appliedAt' | 'businessNumber' | 'id' | 'status' | 'storeName'
> = {
  addressDetail: '역삼동, 런치타워 1층 102호',
  businessDays: '월요일 ~ 일요일',
  businessLicenseRegistered: true,
  businessVerified: true,
  category: '한식',
  menus: [
    { name: '명품 한우 설렁탕', price: '12,000원' },
    { name: '바삭 고소 감자전', price: '8,000원' },
  ],
  ownerName: '홍길동',
  phoneNumber: '02-1234-5678',
  termsAgreed: true,
  weekdayHours: '11:00 ~ 21:00',
  weekendHours: '11:00 ~ 20:00',
};
