import type { HTMLAttributes, ReactNode } from 'react';

import type { TableColumnSettingsState } from '@admin/ui/DataTable/dataTableTypes';
import { TableColumnSettings } from '@admin/ui/DataTable/TableColumnSettings';
import {
  Pagination,
  type PaginationProps,
} from '@admin/ui/Pagination/Pagination';
import {
  TableDensityControl,
  type TableDensityControlProps,
} from '@admin/ui/TableDensityControl/TableDensityControl';

export interface FilterBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 제목은 필터·설정과 같은 행에, 설명은 그 아래 행에 표시한다. */
  heading?: string;
  description?: ReactNode;
  children?: ReactNode;
  pagination?: PaginationProps;
  density?: TableDensityControlProps;
  columnSettings?: TableColumnSettingsState;
}

// 상태는 화면에서 관리하고, 조회 화면마다 같은 순서로 컨트롤을 배치한다.
export const FilterBar = ({
  heading,
  description,
  children,
  className,
  pagination,
  density,
  columnSettings,
  ...props
}: FilterBarProps) => {
  return (
    <div
      className={[
        'admin-filter-bar relative z-20 flex min-h-12 flex-wrap items-center gap-3 px-3 py-1',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {heading && (
        <h3 className="text-heading-sm-web font-semibold text-text-primary">
          {heading}
        </h3>
      )}
      {pagination && <Pagination {...pagination} />}
      <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-3">
        {/* 필터가 길어지면 줄바꿈하되 행 높이 설정은 오른쪽 끝에 유지한다. */}
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-3">
          {children}
        </div>
        {columnSettings && (
          <div className="shrink-0">
            <TableColumnSettings
              fields={columnSettings.fields}
              preferences={columnSettings.preferences}
              onApply={columnSettings.applyPreferences}
            />
          </div>
        )}
        {density && (
          <div className="shrink-0">
            <TableDensityControl {...density} />
          </div>
        )}
      </div>
      {description && (
        <p className="w-full text-caption-web leading-5 text-text-secondary">
          {description}
        </p>
      )}
    </div>
  );
};
