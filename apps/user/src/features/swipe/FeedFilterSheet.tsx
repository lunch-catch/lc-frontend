import { type FormEvent, useState } from 'react';
import { BottomSheet, SegmentedControl } from '@repo/ui';
import { Check } from 'lucide-react';

import {
  type FeedFilter,
  type FeedSort,
  saveFeedFilter,
} from '@user/api/feedFilter';
import type { BusinessCategory } from '@user/api/store';
import ActionButton from '@user/components/ActionButton/ActionButton';
import {
  categoryIcons,
  categoryOptions,
  shortCategoryLabels,
} from '@user/features/explore/categoryIcons';

const sortItems: { value: FeedSort; label: string }[] = [
  { value: 'DISTANCE', label: '거리순' },
  { value: 'DISCOUNT_RATE', label: '할인율순' },
];

interface FeedFilterSheetProps {
  filter: FeedFilter;
  onClose: () => void;
  onSaved: (filter: FeedFilter) => void;
}

// 피드 필터 고르기. 업종은 여러 개 고를 수 있고, 하나도 고르지 않으면 전체 업종이다
// 업종은 탐색 탭과 같은 음식 그림과 다섯 칸 격자로, 정렬은 설정 화면 모드와 같은 둘 중 하나 버튼으로 고른다
// 닫힐 때 화면에서 빠져 고르던 값도 함께 지워진다
const FeedFilterSheet = ({
  filter,
  onClose,
  onSaved,
}: FeedFilterSheetProps) => {
  const [categories, setCategories] = useState(filter.categories);
  const [sort, setSort] = useState(filter.sort);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  // 전체를 누르면 고른 업종을 모두 푼다. 업종을 하나도 고르지 않은 상태가 전체다
  const toggleCategory = (category: 'ALL' | BusinessCategory) => {
    if (category === 'ALL') {
      setCategories([]);
      return;
    }
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setIsSaving(true);
    setHasError(false);
    try {
      onSaved(await saveFeedFilter({ categories, sort }));
    } catch {
      setHasError(true);
      setIsSaving(false);
    }
  };

  return (
    <BottomSheet isOpen onClose={onClose} title="피드 필터">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        <fieldset className="grid min-w-0 grid-cols-5 gap-y-2">
          <legend className="mb-3 text-body-sm-mobile font-bold text-text-primary">
            업종 · 여러 개 선택
          </legend>
          {categoryOptions.map((option) => {
            const isSelected =
              option.value === 'ALL'
                ? categories.length === 0
                : categories.includes(option.value);
            const shortLabel = shortCategoryLabels[option.value];

            return (
              <label
                className="flex cursor-pointer flex-col items-center gap-1 py-1"
                key={option.value}
              >
                <input
                  checked={isSelected}
                  className="peer sr-only"
                  name="feed-filter-category"
                  onChange={() => toggleCategory(option.value)}
                  type="checkbox"
                  value={option.value}
                />
                <span
                  className={`relative flex size-14 items-center justify-center rounded-full border bg-bg-surface transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
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
                  {/* 여러 개 고를 수 있다는 걸 알 수 있게 고른 칸에 체크를 붙인다 */}
                  {isSelected && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-action-primary text-text-inverse ring-2 ring-bg-surface"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={`text-caption-mobile whitespace-nowrap ${
                    isSelected
                      ? 'font-bold text-text-brand'
                      : 'font-medium text-text-primary'
                  }`}
                >
                  {shortLabel ? (
                    <>
                      <span aria-hidden="true">{shortLabel}</span>
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

        <section className="flex flex-col gap-3">
          <h3 className="text-body-sm-mobile font-bold text-text-primary">
            정렬
          </h3>
          {/* 공통 버튼은 내용 폭만큼이라, 시트 폭을 다 쓰도록 늘린다 */}
          <div className="[&>div]:grid [&>div]:w-full [&_button]:min-h-10 [&_button]:text-body-sm-mobile">
            <SegmentedControl
              ariaLabel="정렬"
              items={sortItems}
              onValueChange={setSort}
              value={sort}
            />
          </div>
          <p className="text-caption-mobile text-text-secondary">
            일부 카드는 정렬과 상관없이 보여요
          </p>
        </section>

        {hasError && (
          <p className="text-body-sm-mobile text-status-danger-fg" role="alert">
            필터를 저장하지 못했어요
          </p>
        )}
        <ActionButton loading={isSaving} size="large" type="submit">
          저장
        </ActionButton>
      </form>
    </BottomSheet>
  );
};

export default FeedFilterSheet;
