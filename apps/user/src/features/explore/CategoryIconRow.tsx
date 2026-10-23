import { type PointerEvent, useEffect, useRef } from 'react';

import { CATEGORY_FILTER_OPTIONS, type CategoryFilter } from '@user/api/store';
import {
  categoryIcons,
  shortCategoryLabels as shortLabels,
} from '@user/ui/CategoryIcon/categoryIcons';

interface CategoryIconRowProps {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
}

// 탐색 탭의 업종 고르기. 열 개를 한 줄에 두고 옆으로 밀어 본다
// 두 줄로 다 펼치면 목록이 그만큼 밀려 내려가서, 배민·쿠팡이츠처럼 한 줄로 둔다
// 한 칸을 52px로 두어 화면 끝에 다음 아이콘이 걸쳐 보이게 해서 옆에 더 있다는 걸 알린다
// 이만큼 끌면 누른 것이 아니라 끈 것으로 본다
const DRAG_START_PX = 5;

const CategoryIconRow = ({ onChange, value }: CategoryIconRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);
  // 마우스로 끌어 옮기는 중인 줄의 시작 위치. 손가락은 브라우저가 알아서 밀어 주므로 마우스만 다룬다
  const drag = useRef<{ startX: number; startLeft: number } | null>(null);
  const didDrag = useRef(false);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    didDrag.current = false;
    drag.current = {
      startX: event.clientX,
      startLeft: event.currentTarget.scrollLeft,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current;
    if (!start) return;

    const distance = event.clientX - start.startX;
    if (!didDrag.current) {
      if (Math.abs(distance) < DRAG_START_PX) return;
      didDrag.current = true;
      // 끄는 동안에는 칸에 달라붙지 않게 하고, 마우스가 줄 밖으로 나가도 계속 따라오게 잡는다
      event.currentTarget.style.scrollSnapType = 'none';
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    event.currentTarget.scrollLeft = start.startLeft - distance;
  };

  const finishDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    drag.current = null;
    event.currentTarget.style.scrollSnapType = '';
  };

  // 끌고 놓은 자리에서 업종이 눌려 바뀌지 않게, 끈 직후의 클릭은 버린다
  const handleClickCapture = (event: React.MouseEvent) => {
    if (!didDrag.current) return;
    didDrag.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  // 고른 업종이 화면 밖에 있으면 보이도록 줄만 옆으로 민다
  // scrollIntoView는 화면 전체를 세로로도 움직일 수 있어서 줄의 가로 위치만 직접 바꾼다
  useEffect(() => {
    const row = rowRef.current;
    const selected = row?.querySelector<HTMLElement>(
      'label:has(input:checked)',
    );
    if (!row || !selected) return;

    const left = selected.offsetLeft;
    const right = left + selected.offsetWidth;
    if (left < row.scrollLeft || right > row.scrollLeft + row.clientWidth) {
      row.scrollTo({
        left: left - (row.clientWidth - selected.offsetWidth) / 2,
        behavior: 'smooth',
      });
    }
  }, [value]);

  return (
    // 줄은 화면 양끝까지 밀리게 좌우 여백 밖으로 넓히고, 첫·마지막 칸만 여백만큼 안쪽에서 시작한다
    // 숨긴 라디오(sr-only)는 절대 위치라 relative로 이 줄 안에 가둔다. 안 그러면 화면 밖 칸의 라디오가 화면 전체를 옆으로 넓힌다
    <div
      className="relative -mx-page min-w-0 snap-x overflow-x-auto scroll-px-page px-page"
      onClickCapture={handleClickCapture}
      onPointerCancel={finishDrag}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishDrag}
      ref={rowRef}
    >
      <fieldset className="flex w-max">
        <legend className="sr-only">업종</legend>
        {CATEGORY_FILTER_OPTIONS.map((option) => {
          const isSelected = value === option.value;

          return (
            <label
              className="flex w-13 shrink-0 cursor-pointer snap-start flex-col items-center gap-1 py-1"
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
                className={`flex size-11 items-center justify-center rounded-full border bg-bg-surface transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-action-primary ${
                  isSelected
                    ? 'border-2 border-action-primary'
                    : 'border-border-subtle'
                }`}
              >
                <img
                  alt=""
                  className="size-7 object-contain"
                  height={28}
                  src={categoryIcons[option.value]}
                  width={28}
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
    </div>
  );
};

export default CategoryIconRow;
