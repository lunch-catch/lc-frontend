import {
  BUSINESS_CATEGORY_LABELS,
  type BusinessCategory,
} from '@user/api/store';
import categoryAll from '@user/assets/icons/category/category-all.webp';
import categoryAsian from '@user/assets/icons/category/category-asian.webp';
import categoryBunsik from '@user/assets/icons/category/category-bunsik.webp';
import categoryCafeDessert from '@user/assets/icons/category/category-cafe-dessert.webp';
import categoryChinese from '@user/assets/icons/category/category-chinese.webp';
import categoryFastFood from '@user/assets/icons/category/category-fast-food.webp';
import categoryJapanese from '@user/assets/icons/category/category-japanese.webp';
import categoryKorean from '@user/assets/icons/category/category-korean.webp';
import categoryOther from '@user/assets/icons/category/category-other.webp';
import categoryWestern from '@user/assets/icons/category/category-western.webp';

export type CategoryFilter = 'ALL' | BusinessCategory;

// 업종별 음식 그림 (96×96, 그림 둘레 여백을 잘라 10장의 크기를 맞췄다)
// 탐색 탭 업종 고르기와 피드 필터가 같은 그림을 쓴다
export const categoryIcons: Record<CategoryFilter, string> = {
  ALL: categoryAll,
  KOREAN: categoryKorean,
  CHINESE: categoryChinese,
  JAPANESE: categoryJapanese,
  WESTERN: categoryWestern,
  BUNSIK: categoryBunsik,
  ASIAN: categoryAsian,
  FAST_FOOD: categoryFastFood,
  CAFE_DESSERT: categoryCafeDessert,
  OTHER: categoryOther,
};

export const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  ...Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as BusinessCategory,
    label,
  })),
];

// 다섯 칸 격자에서 칸보다 긴 이름은 짧게 보여준다. 화면 읽기 프로그램에는 원래 이름을 읽어 준다
export const shortCategoryLabels: Partial<Record<CategoryFilter, string>> = {
  CAFE_DESSERT: '카페',
};
