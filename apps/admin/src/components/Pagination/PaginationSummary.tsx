import { SelectField } from '@repo/ui';
import { formatNumber } from '@repo/utils';

export interface PaginationSummaryProps {
  onPageSizeChange?: (pageSize: number) => void;
  pageSize?: number;
  totalCount: number;
}

// 화면별 선택지 차이를 막기 위해 공통 컴포넌트에서만 정의한다.
const pageSizeOptions = [5, 10, 20, 50].map((pageSize) => ({
  label: `${pageSize}개씩 보기`,
  value: String(pageSize),
}));

// 빈 목록에서도 표시 개수를 바꿀 수 있어 페이지네이션의 숨김 조건을 적용하지 않는다.
// 목록 하단의 선택 메뉴는 위로 열어 화면 밖으로 나가는 것을 줄인다.
export const PaginationSummary = ({
  onPageSizeChange,
  pageSize = 10,
  totalCount,
}: PaginationSummaryProps) => (
  <div className="mt-3 flex w-full flex-wrap items-center justify-end gap-3">
    <span className="whitespace-nowrap text-caption-web text-text-secondary">
      총 {formatNumber(totalCount)}건
    </span>
    {onPageSizeChange && (
      <SelectField
        aria-label="페이지당 항목 수"
        fitContent
        menuPlacement="top"
        onValueChange={(value) => onPageSizeChange(Number(value))}
        options={pageSizeOptions}
        size="compact"
        value={String(pageSize)}
      />
    )}
  </div>
);
