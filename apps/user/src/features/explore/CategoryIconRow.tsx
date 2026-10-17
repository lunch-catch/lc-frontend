import {
  type CategoryFilter,
  categoryIcons,
  categoryOptions,
  shortCategoryLabels as shortLabels,
} from './categoryIcons';

export type { CategoryFilter };

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
