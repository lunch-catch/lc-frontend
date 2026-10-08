import type { HTMLAttributes } from 'react';
import { createContext, useContext } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

import type {
  DataTableProps,
  TableCellProps,
  TableDensity,
  TableHeaderCellProps,
  TableResizeContextValue,
} from './dataTableTypes';
import { useTableColumnResize } from './useTableColumnResize';

const TableDensityContext = createContext<TableDensity>('normal');
const TableResizeContext = createContext<TableResizeContextValue>({
  columns: [],
  resizableColumns: false,
});

export const DataTableRoot = ({
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

  return (
    <td
      className={[
        tableCellHeightClassName[density],
        'overflow-hidden whitespace-nowrap px-4 text-ellipsis text-caption-web text-table-body-text transition-[height] duration-200 ease-out motion-reduce:transition-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </td>
  );
};

export const TableRow = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) => {
  return (
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
  );
};
