import type { CSSProperties, HTMLAttributes } from 'react';
import { createContext, useContext } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronRight } from 'lucide-react';

import type {
  DataTableColumn,
  DataTableProps,
  TableCellProps,
  TableColumnSettingsState,
  TableDensity,
  TableHeaderCellProps,
  TableResizeContextValue,
  TableRowProps,
} from './dataTableTypes';
import {
  alignTableCells,
  reorderTableChildren,
} from './tableColumnPreferences';
import { TableColumnSettings } from './TableColumnSettings';
import { TableScrollViewport } from './TableScrollViewport';
import {
  defaultColumnMinWidth,
  useTableColumnResize,
} from './useTableColumnResize';
import { useTableColumnSettings } from './useTableColumnSettings';

const TableDensityContext = createContext<TableDensity>('normal');
const TableDetailArrowContext = createContext(false);
const TableResizeContext = createContext<TableResizeContextValue>({
  columns: [],
  resizableColumns: false,
});

export const DataTableRoot = ({
  personalizationKey,
  columnSettings,
  ...props
}: DataTableProps) => {
  if (columnSettings) {
    return <ConfiguredTable {...props} settings={columnSettings} />;
  }
  const fields =
    props.columns?.map((column) => ({
      key: column.key ?? column.label ?? '',
      label: column.label ?? '',
    })) ?? [];
  if (
    !personalizationKey ||
    !fields.length ||
    fields.some((field) => !field.key || !field.label) ||
    new Set(fields.map((field) => field.key)).size !== fields.length
  ) {
    return <DataTableView {...props} />;
  }
  return (
    <PersonalizedTable
      key={personalizationKey + fields.map((field) => field.key).join('|')}
      {...props}
      tableKey={personalizationKey}
    />
  );
};

interface PersonalizedTableProps extends DataTableProps {
  tableKey: string;
}

// 필터바가 없는 테이블은 자체 설정 버튼을 표시한다.
const PersonalizedTable = ({
  tableKey,
  columns = [],
  ...props
}: PersonalizedTableProps) => {
  const settings = useTableColumnSettings(tableKey, columns);
  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-3">
        <TableColumnSettings
          fields={settings.fields}
          preferences={settings.preferences}
          onApply={settings.applyPreferences}
        />
      </div>
      <ConfiguredTable {...props} columns={columns} settings={settings} />
    </>
  );
};

interface ConfiguredTableProps extends DataTableProps {
  settings: TableColumnSettingsState;
}

const ConfiguredTable = ({
  settings,
  columns = [],
  children,
  ...props
}: ConfiguredTableProps) => {
  const { fields, preferences, storageError } = settings;
  const indexes = preferences
    .filter((field) => field.visible)
    .map((field) => fields.findIndex((source) => source.key === field.key));
  const visibleColumns: DataTableColumn[] = indexes.map(
    (index) => columns[index],
  );
  const transformedChildren = reorderTableChildren(
    children,
    indexes,
    columns.length,
    TableRow,
    TableHeaderCell,
  );
  return (
    <>
      {storageError && (
        <p role="status" className="text-caption-web text-text-secondary">
          {storageError}
        </p>
      )}
      <DataTableView
        key={indexes.join(',')}
        {...props}
        columns={visibleColumns}
      >
        {transformedChildren}
      </DataTableView>
    </>
  );
};

const DataTableView = ({
  children,
  className,
  style,
  stickyHeaderOffset,
  scrollMaxHeight,
  columns,
  density = 'normal',
  resizableColumns = false,
  ...props
}: DataTableProps) => {
  const { tableRef, tableColumns, resizedColumnWidths, handleResizeStart } =
    useTableColumnResize(columns);
  // 열 숨김이 반영된 표시 열의 최소 너비를 모든 화면에서 같은 기준으로 계산한다.
  const minimumWidth = columns?.reduce(
    (sum, column) => sum + (column.minWidth ?? defaultColumnMinWidth),
    0,
  );
  const internalScroll = scrollMaxHeight !== undefined;
  const headerOffset =
    stickyHeaderOffset ??
    (internalScroll
      ? 0
      : 'var(--table-scroll-header-offset, calc(var(--space-6) * -1))');

  return (
    <TableDensityContext.Provider value={density}>
      <TableResizeContext.Provider
        value={{
          columns: tableColumns,
          onResizeStart: resizableColumns ? handleResizeStart : undefined,
          resizableColumns,
        }}
      >
        <div
          className={`${internalScroll ? 'overflow-hidden' : 'overflow-visible'} min-w-0 max-w-full rounded-md border border-table-border bg-bg-surface`}
        >
          <TableScrollViewport maxHeight={scrollMaxHeight}>
            <table
              className={[
                // 실제 데이터 셀이 있을 때만 헤더를 고정한다. 빈 상태·로딩·오류 행은 제외한다.
                'w-full text-left [&_thead]:static [&:has(tbody_[data-table-cell])_thead]:sticky [&_thead]:top-[var(--table-header-offset)] [&_thead]:z-10 [&_thead]:bg-[var(--admin-table-header-bg,var(--semantic-surface-subtle))] [&_td:first-child]:pl-[var(--space-6)] [&_td:last-child]:pr-[var(--space-6)] [&_th:first-child]:pl-[var(--space-6)] [&_th:last-child]:pr-[var(--space-6)]',
                // 내부 스크롤에서는 병합 테두리의 sticky 겹침을 피하고 모서리는 바깥 프레임에서 자른다.
                internalScroll
                  ? 'border-separate border-spacing-0 [&_th:first-child]:rounded-none [&_th:last-child]:rounded-none [&_tbody_td]:border-b [&_tbody_td]:border-table-divider [&_tbody_tr:last-child_td]:border-b-0'
                  : 'border-collapse',
                columns?.length ? 'table-fixed' : '',
                className,
              ]
                .filter(Boolean)
                .join(' ')}
              ref={tableRef}
              style={
                {
                  minWidth: minimumWidth,
                  ...style,
                  '--table-header-offset':
                    typeof headerOffset === 'number'
                      ? `${headerOffset}px`
                      : headerOffset,
                } as CSSProperties
              }
              {...props}
            >
              {columns && (
                <colgroup>
                  {columns.map((column, index) => (
                    <col
                      key={index}
                      style={{
                        width: resizedColumnWidths?.[index] ?? column.width,
                      }}
                    />
                  ))}
                </colgroup>
              )}
              {columns?.some((column) => column.align)
                ? reorderTableChildren(
                    children,
                    columns.map((_, index) => index),
                    columns.length,
                    TableRow,
                    TableHeaderCell,
                    columns,
                  )
                : children}
            </table>
          </TableScrollViewport>
        </div>
      </TableResizeContext.Provider>
    </TableDensityContext.Provider>
  );
};

export const TableHeader = (props: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...props} />
);

export const TableHeaderCell = ({
  children,
  className,
  columnIndex,
  onSortChange,
  sortDirection,
  style,
  ...props
}: TableHeaderCellProps) => {
  const { columns, onResizeStart, resizableColumns } =
    useContext(TableResizeContext);
  const canResize =
    resizableColumns &&
    columnIndex !== undefined &&
    columnIndex < columns.length - 1;
  const SortIcon =
    sortDirection === 'asc'
      ? ArrowUp
      : sortDirection === 'desc'
        ? ArrowDown
        : ArrowUpDown;

  return (
    <th
      aria-sort={
        sortDirection === 'asc'
          ? 'ascending'
          : sortDirection === 'desc'
            ? 'descending'
            : onSortChange
              ? 'none'
              : undefined
      }
      className={[
        'group/header relative h-10 bg-[var(--admin-table-header-bg,var(--semantic-surface-subtle))] px-4 text-caption-web font-normal text-table-header-text first:rounded-tl-md last:rounded-tr-md',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      scope="col"
      style={style}
      {...props}
    >
      {onSortChange ? (
        <button
          aria-label={`${children} ${
            sortDirection === 'asc'
              ? '정렬 해제'
              : sortDirection === 'desc'
                ? '오름차순 정렬'
                : '내림차순 정렬'
          }`}
          className="flex h-full w-full cursor-pointer items-center gap-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-action-primary"
          style={
            style?.textAlign
              ? {
                  textAlign: style.textAlign,
                  justifyContent:
                    style.textAlign === 'right'
                      ? 'flex-end'
                      : style.textAlign === 'center'
                        ? 'center'
                        : 'flex-start',
                }
              : undefined
          }
          onClick={onSortChange}
          type="button"
        >
          <span>{children}</span>
          <SortIcon
            aria-hidden="true"
            className={`invisible size-3.5 shrink-0 text-action-primary opacity-0 transition-[color,opacity] group-hover/header:visible group-hover/header:opacity-100 ${
              sortDirection ? 'visible opacity-100' : ''
            }`}
          />
        </button>
      ) : sortDirection ? (
        // 서버 고정 정렬은 상태만 표시하고 정렬 변경 버튼은 만들지 않는다.
        <span className="flex items-center gap-1">
          <span>{children}</span>
          <SortIcon
            aria-hidden="true"
            className="size-3.5 shrink-0 text-action-primary"
          />
        </span>
      ) : (
        children
      )}
      {canResize && (
        <button
          aria-label={`${children} 열 너비 조절`}
          className="absolute inset-y-0 -right-1.5 z-10 w-3 cursor-col-resize touch-none after:absolute after:inset-y-2 after:left-1/2 after:w-px after:bg-border-subtle hover:after:w-0.5 hover:after:bg-action-primary focus-visible:after:w-0.5 focus-visible:after:bg-action-primary focus-visible:outline-none"
          onPointerDown={(event) => onResizeStart?.(columnIndex, event)}
          type="button"
        />
      )}
    </th>
  );
};

const tableCellHeightClassName: Record<TableDensity, string> = {
  compact: 'h-[var(--space-10)]',
  normal: 'h-[var(--space-12)]',
  comfortable: 'h-[var(--space-14)]',
};

export const TableCell = ({
  children,
  className,
  ...props
}: TableCellProps) => {
  const density = useContext(TableDensityContext);
  const showDetailArrow = useContext(TableDetailArrowContext);

  return (
    <td
      data-table-cell=""
      className={[
        tableCellHeightClassName[density],
        'overflow-hidden whitespace-nowrap px-4 text-ellipsis text-caption-web text-table-body-text transition-[height] duration-200 ease-out motion-reduce:transition-none',
        // 뱃지는 텍스트와 달리 자체 배경을 가진 요소이므로 뒤에 말줄임표를 덧붙이지 않는다.
        '[&:has([data-status-badge])]:text-clip',
        showDetailArrow && 'relative [&:last-child]:!pr-12',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
      {showDetailArrow && (
        <ChevronRight
          aria-hidden="true"
          className="pointer-events-none absolute right-[var(--space-6)] top-1/2 hidden size-4 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [td:last-child_&]:block"
        />
      )}
    </td>
  );
};

export const TableRow = ({
  children,
  className,
  showDetailArrow = false,
  ...props
}: TableRowProps) => {
  const { columns } = useContext(TableResizeContext);
  // 부모가 아직 렌더링되지 않은 하위 컴포넌트의 셀을 못 찾더라도 행에서 정렬을 적용한다.
  return (
    // 마지막 DOM 셀을 기준으로 표시하므로 열 숨김·재배치 후에도 화살표는 행 끝에 남는다.
    <TableDetailArrowContext.Provider value={showDetailArrow}>
      <tr
        className={[
          'group border-b border-table-divider bg-bg-surface transition-[height,background-color] duration-200 ease-out hover:bg-[var(--admin-table-row-hover-bg,var(--semantic-surface-subtle))] last:border-b-0 last:[&>td:first-child]:rounded-bl-md last:[&>td:last-child]:rounded-br-md motion-reduce:transition-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {alignTableCells(children, columns)}
      </tr>
    </TableDetailArrowContext.Provider>
  );
};
