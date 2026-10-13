import type { HTMLAttributes } from 'react';
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
import { reorderTableChildren } from './tableColumnPreferences';
import { TableColumnSettings } from './TableColumnSettings';
import { useTableColumnResize } from './useTableColumnResize';
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
  columns,
  density = 'normal',
  resizableColumns = false,
  ...props
}: DataTableProps) => {
  const { tableRef, tableColumns, resizedColumnWidths, handleResizeStart } =
    useTableColumnResize(columns);

  return (
    <TableDensityContext.Provider value={density}>
      <TableResizeContext.Provider
        value={{
          columns: tableColumns,
          onResizeStart: resizableColumns ? handleResizeStart : undefined,
          resizableColumns,
        }}
      >
        <div className="overflow-visible rounded-md border border-table-border bg-bg-surface">
          <table
            className={[
              'w-full border-collapse text-left [&_thead]:sticky [&_thead]:top-[calc(var(--space-6)*-1)] [&_thead]:z-10 [&_thead]:bg-surface-subtle [&_td:first-child]:pl-[var(--space-6)] [&_td:last-child]:pr-[var(--space-6)] [&_th:first-child]:pl-[var(--space-6)] [&_th:last-child]:pr-[var(--space-6)]',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            ref={tableRef}
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
            {children}
          </table>
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
        'group/header relative h-10 border-r border-table-divider bg-surface-subtle px-4 text-caption-web font-normal text-table-header-text first:rounded-tl-md last:rounded-tr-md last:border-r-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      scope="col"
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
          className="flex h-full cursor-pointer items-center gap-1 rounded-sm text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-action-primary"
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
      className={[
        tableCellHeightClassName[density],
        'overflow-hidden whitespace-nowrap px-4 text-ellipsis text-caption-web text-table-body-text transition-[height] duration-200 ease-out motion-reduce:transition-none',
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
  return (
    // 마지막 DOM 셀을 기준으로 표시하므로 열 숨김·재배치 후에도 화살표는 행 끝에 남는다.
    <TableDetailArrowContext.Provider value={showDetailArrow}>
      <tr
        className={[
          'group border-b border-table-divider bg-bg-surface transition-[height,background-color] duration-200 ease-out hover:bg-surface-subtle last:border-b-0 last:[&>td:first-child]:rounded-bl-md last:[&>td:last-child]:rounded-br-md motion-reduce:transition-none',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </tr>
    </TableDetailArrowContext.Provider>
  );
};
