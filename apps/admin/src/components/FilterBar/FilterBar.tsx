import type { HTMLAttributes, ReactNode } from 'react';

import {
  Pagination,
  type PaginationProps,
} from '@admin/components/Pagination/Pagination';
import {
  TableDensityControl,
  type TableDensityControlProps,
} from '@admin/components/TableDensityControl/TableDensityControl';

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  pagination?: PaginationProps;
  density?: TableDensityControlProps;
}

// 상태는 화면에서 관리하고, 조회 화면마다 같은 순서로 컨트롤을 배치한다.
export const FilterBar = ({
  children,
  className,
  pagination,
  density,
  ...props
}: FilterBarProps) => {
  return (
    <div
      className={[
        'relative z-20 flex min-h-12 flex-wrap items-center gap-3 px-3 py-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {pagination && <Pagination {...pagination} />}
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
        {/* 필터가 길어지면 줄바꿈하되 행 높이 설정은 오른쪽 끝에 유지한다. */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
          {children}
        </div>
        {density && (
          <div className="shrink-0">
            <TableDensityControl {...density} />
          </div>
        )}
      </div>
    </div>
  );
};
