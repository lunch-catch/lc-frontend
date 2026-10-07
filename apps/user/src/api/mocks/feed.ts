import type { FeedCard } from '@user/api/feed';

import { type PosterSlotValues, renderMockPoster } from './posterTemplates';

// Unsplash 음식 사진 (카드 폭 328px의 2배 크기로 요청)
const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=656&q=70&fm=webp&fit=crop`;

// 점주 앱 mock 가게(apps/owner/src/api/mocks/store.ts)의 수제 치즈 돈까스 사진
const OWNER_CHEESE_KATSU_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=720&q=70&fm=webp&fit=crop';

// 점주 앱의 진행 중 캠페인(apps/owner/src/api/mocks/campaigns.ts)과 같은 포스터.
// 점주가 만든 포스터가 사용자 피드에 그대로 보이는지 확인할 수 있게 첫 카드로 둔다
const ownerPosters: Record<
  string,
  { templateIndex: number; slots: PosterSlotValues }
> = {
  'campaign-katsu': {
    templateIndex: 0,
    slots: {
      eventName: '오늘 점심 한정 특별 혜택!',
      discountText: '전 메뉴 20% 할인',
      period: '11:30 ~ 15:00',
      storeName: '카츠쿠라 역삼점',
      imageUrl: OWNER_CHEESE_KATSU_IMAGE,
    },
  },
};

const feedCardData: Omit<FeedCard, 'posterHtml'>[] = [
  {
    serveId: 'serve-0',
    campaignId: 'campaign-katsu',
    storeId: 'store-katsu',
    storeName: '카츠쿠라 역삼점',
    category: '일식',
    walkMinutes: 3,
    imageUrl: OWNER_CHEESE_KATSU_IMAGE,
    offerTitle: '전 메뉴 20% 할인',
    originalPrice: 11000,
    salePrice: 8800,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '15:00',
    remainingCount: 50,
  },
  {
    serveId: 'serve-1',
    campaignId: 'campaign-1',
    storeId: 'store-1',
    storeName: '성수 화로구이',
    category: '양식',
    walkMinutes: 4,
    imageUrl: photo('1568901346375-23c9450c58cd'),
    offerTitle: '런치 세트 할인',
    originalPrice: 18000,
    salePrice: 12900,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:00',
    remainingCount: 12,
  },
  {
    serveId: 'serve-2',
    campaignId: 'campaign-2',
    storeId: 'store-2',
    storeName: '도우앤치즈',
    category: '양식',
    walkMinutes: 6,
    imageUrl: photo('1565299624946-b28f40a0ae38'),
    offerTitle: '1인 피자 세트',
    originalPrice: 15000,
    salePrice: 10500,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '13:30',
    remainingCount: 8,
  },
  {
    serveId: 'serve-3',
    campaignId: 'campaign-3',
    storeId: 'store-3',
    storeName: '스시 하루',
    category: '일식',
    walkMinutes: 3,
    imageUrl: photo('1553621042-f6e147245754'),
    offerTitle: '점심 초밥 12피스',
    originalPrice: 22000,
    salePrice: 16900,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:00',
    remainingCount: 5,
  },
  {
    serveId: 'serve-4',
    campaignId: 'campaign-4',
    storeId: 'store-4',
    storeName: '멘야 텐',
    category: '일식',
    walkMinutes: 7,
    imageUrl: photo('1569718212165-3a8278d5f624'),
    offerTitle: '새우 라멘',
    originalPrice: 13000,
    salePrice: 9900,
    issueOpenTime: '11:00',
    usableFrom: '12:00',
    usableTo: '14:00',
    remainingCount: 20,
  },
  {
    serveId: 'serve-5',
    campaignId: 'campaign-5',
    storeId: 'store-5',
    storeName: '홍루 반점',
    category: '중식',
    walkMinutes: 5,
    imageUrl: photo('1585032226651-759b368d7246'),
    offerTitle: '볶음면 단품 할인',
    originalPrice: 11000,
    salePrice: 7900,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '15:00',
    remainingCount: 15,
  },
  {
    serveId: 'serve-6',
    campaignId: 'campaign-6',
    storeId: 'store-6',
    storeName: '새우 볶음밥 연구소',
    category: '중식',
    walkMinutes: 9,
    imageUrl: photo('1512058564366-18510be2db19'),
    offerTitle: '새우 볶음밥 + 계란국',
    originalPrice: 10000,
    salePrice: 7500,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:00',
    remainingCount: 3,
  },
  {
    serveId: 'serve-7',
    campaignId: 'campaign-7',
    storeId: 'store-7',
    storeName: '포케 스테이션',
    category: '샐러드',
    walkMinutes: 2,
    imageUrl: photo('1546069901-ba9599a7e63c'),
    offerTitle: '연어 포케 볼',
    originalPrice: 14500,
    salePrice: 11000,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:30',
    remainingCount: 10,
  },
  {
    serveId: 'serve-8',
    campaignId: 'campaign-8',
    storeId: 'store-8',
    storeName: '방콕 키친',
    category: '아시안',
    walkMinutes: 8,
    imageUrl: photo('1604908176997-125f25cc6f3d'),
    offerTitle: '치킨 커리 런치',
    originalPrice: 12500,
    salePrice: 8900,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:00',
    remainingCount: 7,
  },
  {
    serveId: 'serve-9',
    campaignId: 'campaign-9',
    storeId: 'store-9',
    storeName: '그릴 앤 그린',
    category: '샐러드',
    walkMinutes: 6,
    imageUrl: photo('1504674900247-0877df9cc836'),
    offerTitle: '스테이크 샐러드',
    originalPrice: 16000,
    salePrice: 12000,
    issueOpenTime: '11:00',
    usableFrom: '12:00',
    usableTo: '14:00',
    remainingCount: 4,
  },
  {
    serveId: 'serve-10',
    campaignId: 'campaign-10',
    storeId: 'store-10',
    storeName: '그레인 테이블',
    category: '샐러드',
    walkMinutes: 5,
    imageUrl: photo('1547592180-85f173990554'),
    offerTitle: '곡물 볼 + 음료',
    originalPrice: 13500,
    salePrice: 9900,
    issueOpenTime: '11:00',
    usableFrom: '11:30',
    usableTo: '14:00',
    remainingCount: 18,
  },
];

// 카드마다 점주가 만든 포스터 HTML을 붙인다. 실제로는 서버가 저장된 포스터를 함께 내려준다
// 점주 앱과 같은 포스터가 있으면 그대로 쓰고, 나머지는 템플릿을 돌아가며 골라 카드 정보로 채운다
export const mockFeedCards: FeedCard[] = feedCardData.map((card, index) => {
  const ownerPoster = ownerPosters[card.campaignId];
  const posterHtml = ownerPoster
    ? renderMockPoster(ownerPoster.templateIndex, ownerPoster.slots)
    : renderMockPoster(index, {
        discountText: `${Math.round((1 - card.salePrice / card.originalPrice) * 100)}% 할인`,
        eventName: card.offerTitle,
        imageUrl: card.imageUrl,
        period: `${card.usableFrom} ~ ${card.usableTo}`,
        storeName: card.storeName,
      });

  return { ...card, posterHtml };
});
