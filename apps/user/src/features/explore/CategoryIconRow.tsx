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
const categoryIcons: Record<CategoryFilter, string> = {
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

const categoryOptions: { value: CategoryFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  ...Object.entries(BUSINESS_CATEGORY_LABELS).map(([value, label]) => ({
    value: value as BusinessCategory,
    label,
  })),
];

// 다섯 칸 격자에서 칸보다 긴 이름은 짧게 보여준다. 화면 읽기 프로그램에는 원래 이름을 읽어 준다
const shortLabels: Partial<Record<CategoryFilter, string>> = {
  CAFE_DESSERT: '카페',
};

interface CategoryIconRowProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

// 탐색 탭의 업종 고르기. 열 개를 다섯 개씩 두 줄로 두어 넘기지 않고 한눈에 보게 한다
const CategoryIconRow = ({ onChange, value }: CategoryIconRowProps) => {
  return (
    // fieldset은 기본으로 내용보다 좁아지지 않아(min-width: min-content) 화면을 넓힐 수 있어 min-w-0으로 푼다
    <fieldset className="relative grid min-w-0 grid-cols-5 gap-y-1">
      <legend className="sr-only">업종</legend>
      {categoryOptions.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            className="flex cursor-pointer flex-col items-center gap-1 py-1"
            key={option.value}
          >
            <input
              checked={isSelected}
              className="peer sr-only"
              name="store-category"
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span
              className={`flex size-14 items-center justify-center rounded-full border bg-bg-surface transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
                isSelected
                  ? 'border-2 border-action-primary'
                  : 'border-border-subtle'
              }`}
            >
              <img
                alt=""
                className="size-10 object-contain"
                height={40}
                src={categoryIcons[option.value]}
                width={40}
              />
            </span>
            <span
              className={`text-caption-mobile whitespace-nowrap ${
                isSelected
                  ? 'font-bold text-text-brand'
                  : 'font-medium text-text-primary'
              }`}
            >
              {shortLabels[option.value] ? (
                <>
                  <span aria-hidden="true">{shortLabels[option.value]}</span>
                  <span className="sr-only">{option.label}</span>
                </>
              ) : (
                option.label
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
};

export default CategoryIconRow;
