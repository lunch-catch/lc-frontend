import type { DayOfWeek, StoreListItem, StoreMenu } from '@user/api/store';

// Unsplash 음식 사진. 목록 맨 위 큰 카드(약 350px 폭)에도 쓰므로 그 2배 폭으로 요청한다
const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=700&q=70&fm=webp&fit=crop`;

// 강남역 주변 가게. 피드 mock(api/mocks/feed.ts)과 같은 가게를 쓰고, 캠페인이 없는 가게를 몇 곳 더한다
// 검색을 확인할 수 있도록 대표 메뉴명을 함께 둔다 (실제로는 서버가 메뉴명으로 검색한다)
export const mockStores: (StoreListItem & { menuNames: string[] })[] = [
  {
    storeId: 1,
    name: '카츠쿠라 역삼점',
    businessCategory: 'JAPANESE',
    longitude: 127.0301,
    latitude: 37.4995,
    distanceMeters: 240,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'ALL',
      discountType: 'PERCENT',
      discountValue: 20,
    },
    thumbnailUrl: photo('1504674900247-0877df9cc836'),
    menuNames: ['수제 치즈 돈까스', '로스카츠', '냉모밀'],
  },
  {
    storeId: 2,
    name: '성수 화로구이',
    businessCategory: 'WESTERN',
    longitude: 127.0285,
    latitude: 37.4988,
    distanceMeters: 320,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'MENU',
      discountType: 'PERCENT',
      discountValue: 28,
    },
    thumbnailUrl: photo('1568901346375-23c9450c58cd'),
    menuNames: ['수제 버거 세트', '감자튀김'],
  },
  {
    storeId: 3,
    name: '스시 하루',
    businessCategory: 'JAPANESE',
    longitude: 127.0262,
    latitude: 37.4972,
    distanceMeters: 410,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'MENU',
      discountType: 'PERCENT',
      discountValue: 23,
    },
    thumbnailUrl: photo('1553621042-f6e147245754'),
    menuNames: ['런치 초밥 세트', '연어덮밥'],
  },
  {
    storeId: 4,
    name: '홍루 반점',
    businessCategory: 'CHINESE',
    longitude: 127.0312,
    latitude: 37.4961,
    distanceMeters: 530,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'MENU',
      discountType: 'PERCENT',
      discountValue: 28,
    },
    thumbnailUrl: photo('1585032226651-759b368d7246'),
    menuNames: ['짜장면', '짬뽕', '탕수육'],
  },
  {
    storeId: 5,
    name: '도우앤치즈',
    businessCategory: 'WESTERN',
    longitude: 127.0248,
    latitude: 37.5003,
    distanceMeters: 620,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'ALL',
      discountType: 'PERCENT',
      discountValue: 30,
    },
    thumbnailUrl: photo('1565299624946-b28f40a0ae38'),
    menuNames: ['1인 피자 세트', '크림 파스타'],
  },
  {
    storeId: 6,
    name: '멘야 텐',
    businessCategory: 'JAPANESE',
    longitude: 127.0329,
    latitude: 37.5011,
    distanceMeters: 750,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'MENU',
      discountType: 'PERCENT',
      discountValue: 24,
    },
    thumbnailUrl: photo('1569718212165-3a8278d5f624'),
    menuNames: ['돈코츠 라멘', '차슈덮밥'],
  },
  {
    storeId: 7,
    name: '방콕 키친',
    businessCategory: 'ASIAN',
    longitude: 127.0237,
    latitude: 37.4954,
    distanceMeters: 860,
    hasActiveCampaign: true,
    activeCampaign: {
      discountTargetType: 'MENU',
      discountType: 'PERCENT',
      discountValue: 29,
    },
    thumbnailUrl: photo('1604908176997-125f25cc6f3d'),
    menuNames: ['팟타이', '똠얌꿍'],
  },
  {
    storeId: 8,
    name: '역삼 분식',
    businessCategory: 'BUNSIK',
    longitude: 127.0296,
    latitude: 37.4979,
    distanceMeters: 180,
    hasActiveCampaign: false,
    activeCampaign: null,
    thumbnailUrl: photo('1590301157890-4810ed352733'),
    menuNames: ['떡볶이', '김밥', '라볶이'],
  },
  {
    storeId: 9,
    name: '오늘의 국밥',
    businessCategory: 'KOREAN',
    longitude: 127.0274,
    latitude: 37.4966,
    distanceMeters: 450,
    hasActiveCampaign: false,
    activeCampaign: null,
    thumbnailUrl: null,
    menuNames: ['순대국밥', '돼지국밥'],
  },
];

// 가게 상세에만 있는 정보. 캠페인은 피드 mock(api/mocks/feed.ts)의 캠페인과 이어 두어,
// 상세에서 찜하거나 받은 쿠폰이 찜 목록과 쿠폰함에도 그대로 보이게 한다
export const mockStoreDetails: Record<
  number,
  {
    roadAddress: string;
    phone: string;
    // 쉬는 요일. 없으면 매일 영업
    closedDays?: DayOfWeek[];
    menus: Omit<StoreMenu, 'menuId'>[];
    campaignId: string | null;
  }
> = {
  1: {
    roadAddress: '서울특별시 강남구 테헤란로 129',
    phone: '02-555-1201',
    closedDays: ['SUNDAY'],
    menus: [
      { name: '수제 치즈 돈까스', price: 11000 },
      { name: '로스카츠', price: 10000 },
      { name: '냉모밀', price: 8000 },
    ],
    campaignId: 'campaign-katsu',
  },
  2: {
    roadAddress: '서울특별시 강남구 테헤란로 123',
    phone: '02-555-1202',
    menus: [
      { name: '수제 버거 세트', price: 18000 },
      { name: '감자튀김', price: 5000 },
      { name: '레모네이드', price: 4500 },
    ],
    campaignId: 'campaign-1',
  },
  3: {
    roadAddress: '서울특별시 강남구 강남대로 382',
    phone: '02-555-1203',
    closedDays: ['SUNDAY'],
    menus: [
      { name: '점심 초밥 12피스', price: 22000 },
      { name: '연어덮밥', price: 15000 },
      { name: '미소 우동', price: 9000 },
    ],
    campaignId: 'campaign-3',
  },
  4: {
    roadAddress: '서울특별시 강남구 논현로 508',
    phone: '02-555-1204',
    menus: [
      { name: '볶음면', price: 11000 },
      { name: '짬뽕', price: 10000 },
      { name: '탕수육', price: 22000 },
    ],
    campaignId: 'campaign-5',
  },
  5: {
    roadAddress: '서울특별시 강남구 강남대로 396',
    phone: '02-555-1205',
    closedDays: ['MONDAY'],
    menus: [
      { name: '1인 피자 세트', price: 15000 },
      { name: '크림 파스타', price: 14000 },
      { name: '시저 샐러드', price: 9000 },
    ],
    campaignId: 'campaign-2',
  },
  6: {
    roadAddress: '서울특별시 강남구 역삼로 180',
    phone: '02-555-1206',
    closedDays: ['SUNDAY'],
    menus: [
      { name: '새우 라멘', price: 13000 },
      { name: '돈코츠 라멘', price: 11000 },
      { name: '차슈덮밥', price: 9000 },
    ],
    campaignId: 'campaign-4',
  },
  7: {
    roadAddress: '서울특별시 서초구 서초대로77길 54',
    phone: '02-555-1207',
    menus: [
      { name: '치킨 커리 런치', price: 12500 },
      { name: '팟타이', price: 11000 },
      { name: '똠얌꿍', price: 13000 },
    ],
    campaignId: 'campaign-8',
  },
  8: {
    roadAddress: '서울특별시 강남구 테헤란로8길 21',
    phone: '02-555-1208',
    closedDays: ['SUNDAY'],
    menus: [
      { name: '떡볶이', price: 5000 },
      { name: '김밥', price: 4000 },
      { name: '라볶이', price: 6500 },
    ],
    campaignId: null,
  },
  9: {
    roadAddress: '서울특별시 서초구 서초대로73길 9',
    phone: '02-555-1209',
    menus: [
      { name: '순대국밥', price: 10000 },
      { name: '돼지국밥', price: 10000 },
      { name: '수육 정식', price: 14000 },
    ],
    campaignId: null,
  },
};
