import { type FormEvent, useId, useState } from 'react';
import { BottomSheet, SegmentedControl } from '@repo/ui';
import { Check } from 'lucide-react';

import {
  DEFAULT_FEED_FILTER,
  type FeedFilter,
  type FeedSort,
  saveFeedFilter,
} from '@user/api/feedFilter';
import { CATEGORY_FILTER_OPTIONS, type CategoryFilter } from '@user/api/store';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import {
  categoryIcons,
  shortCategoryLabels,
} from '@user/ui/CategoryIcon/categoryIcons';

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
// 업종은 탐색 탭과 같은 음식 그림과 다섯 칸 격자로(48px 원. 탐색 44px보다 조금 크게 두어 고른 칸의 체크가 그림을 덜 가린다), 정렬은 설정 화면 모드와 같은 둘 중 하나 버튼으로 고른다
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
  const categoryHeadingId = useId();

  // 전체를 누르면 고른 업종을 모두 푼다. 업종을 하나도 고르지 않은 상태가 전체다
  const toggleCategory = (category: CategoryFilter) => {
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

  // 고른 값이 기본값(전체 업종, 거리순)과 같으면 초기화할 게 없다
  const isDefault =
    categories.length === 0 && sort === DEFAULT_FEED_FILTER.sort;

  // 업종과 정렬을 기본값으로 되돌린다. 다른 고르기처럼 저장을 눌러야 적용된다
  const reset = () => {
    setCategories(DEFAULT_FEED_FILTER.categories);
    setSort(DEFAULT_FEED_FILTER.sort);
  };

  return (
    <BottomSheet isOpen onClose={onClose} title="피드 필터">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
        {/* 공통 시트 제목 줄에는 버튼을 둘 수 없어, 첫 항목(업종) 제목 줄 오른쪽에 초기화를 둔다 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            {/* "업종"은 점주 쪽 말이라 사용자에게 익숙한 "음식 종류"로 쓴다. 제목은 아래 "정렬"처럼 짧게 두고 안내는 옆에 작게 뺀다 */}
            <h3
              className="flex min-w-0 items-baseline gap-2"
              id={categoryHeadingId}
            >
              <span className="shrink-0 text-body-sm-mobile font-bold text-text-primary">
                음식 종류
              </span>
              <span className="truncate text-caption-mobile font-normal text-text-secondary">
                여러 개 고를 수 있어요
              </span>
            </h3>
            <button
              // 터치 영역을 44px로 넓힌다. 글자는 작게 두어 저장보다 눈에 덜 띄게 한다
              className="-my-3 -mr-2 min-h-11 px-2 text-body-sm-mobile font-medium text-text-brand disabled:text-text-disabled"
              disabled={isDefault}
              onClick={reset}
              type="button"
            >
              초기화
            </button>
          </div>
          <fieldset
            aria-labelledby={categoryHeadingId}
            className="grid min-w-0 grid-cols-5 gap-y-2"
          >
            {CATEGORY_FILTER_OPTIONS.map((option) => {
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
                    className={`relative flex size-12 items-center justify-center rounded-full border bg-bg-surface transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
                      isSelected
                        ? 'border-2 border-action-primary'
                        : 'border-border-subtle'
                    }`}
                  >
                    <img
                      alt=""
                      className="size-8 object-contain"
                      height={32}
                      src={categoryIcons[option.value]}
                      width={32}
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
        </div>

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
