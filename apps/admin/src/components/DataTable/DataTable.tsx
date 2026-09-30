import type {
  CSSProperties,
  HTMLAttributes,
  PointerEvent,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { createContext, useContext, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

export type TableDensity = 'compact' | 'comfortable';

export interface DataTableColumn {
  minWidth?: number;
  width?: CSSProperties['width'];
}

export interface DataTableProps extends TableHTMLAttributes<HTMLTableElement> {
  columns?: DataTableColumn[];
  density?: TableDensity;
  resizableColumns?: boolean;
}
export interface TableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
  columnIndex?: number;
}
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

interface TableStateProps extends TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
}

interface TableErrorProps extends TableStateProps {
  description?: string;
  title?: string;
}

interface TableResizeContextValue {
  columns: DataTableColumn[];
  onResizeStart?: (
    columnIndex: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => void;
  resizableColumns: boolean;
}

const TableDensityContext = createContext<TableDensity>('comfortable');
const TableResizeContext = createContext<TableResizeContextValue>({
  columns: [],
  resizableColumns: false,
});

const defaultColumnMinWidth = 80;

const tableCellHeightClassName: Record<TableDensity, string> = {
  compact: 'h-[var(--space-10)]',
  comfortable: 'h-[var(--space-14)]',
};

const stateCellStyle: CSSProperties = {
  height: 'calc(var(--space-16) * 5)',
};

const stateContentStyle: CSSProperties = {
  alignItems: 'center',
  display: 'flex',
  height: '100%',
  justifyContent: 'center',
  textAlign: 'center',
};

export function DataTable({
  children,
  className,
  columns,
  density = 'comfortable',
  resizableColumns = false,
  ...props
}: DataTableProps) {
  const tableRef = useRef<HTMLTableElement>(null);
  const [resizedColumnWidths, setResizedColumnWidths] = useState<number[]>();
  const tableColumns = columns ?? [];

  const handleResizeStart = (
    columnIndex: number,
    event: PointerEvent<HTMLButtonElement>,
  ) => {
    const headerCells = Array.from(
      tableRef.current?.querySelectorAll('thead th') ?? [],
    );
    const nextColumnIndex = columnIndex + 1;
    const currentHeader = headerCells[columnIndex];
    const nextHeader = headerCells[nextColumnIndex];

    if (!currentHeader || !nextHeader) {
      return;
    }

    event.preventDefault();

    const startWidths = headerCells.map(
      (header) => header.getBoundingClientRect().width,
    );
    const startX = event.clientX;
    const currentMinWidth = Math.min(
      tableColumns[columnIndex]?.minWidth ?? defaultColumnMinWidth,
      startWidths[columnIndex],
    );
    const nextMinWidth = Math.min(
      tableColumns[nextColumnIndex]?.minWidth ?? defaultColumnMinWidth,
      startWidths[nextColumnIndex],
    );
    const maxCurrentWidth =
      startWidths[columnIndex] + startWidths[nextColumnIndex] - nextMinWidth;
    let hasMoved = false;
    let animationFrameId: number | undefined;
    let latestDelta = 0;

    const applyResize = () => {
      animationFrameId = undefined;
      const currentWidth = Math.max(
        currentMinWidth,
        Math.min(startWidths[columnIndex] + latestDelta, maxCurrentWidth),
      );
      const nextWidth =
        startWidths[nextColumnIndex] -
        (currentWidth - startWidths[columnIndex]);

      setResizedColumnWidths(
        startWidths.map((width, index) => {
          if (index === columnIndex) {
            return currentWidth;
          }

          if (index === nextColumnIndex) {
            return nextWidth;
          }

          return width;
        }),
      );
    };

    const handlePointerMove = (moveEvent: globalThis.PointerEvent) => {
      const delta = moveEvent.clientX - startX;

      if (!hasMoved && Math.abs(delta) < 4) {
        return;
      }

      hasMoved = true;
      latestDelta = delta;

      if (animationFrameId === undefined) {
        // 포인터 이동마다 렌더링하지 않고 화면 프레임에 맞춰 열 너비를 갱신한다.
        animationFrameId = window.requestAnimationFrame(applyResize);
      }
    };

    const handlePointerUp = () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
        applyResize();
      }

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <TableDensityContext.Provider value={density}>
      <TableResizeContext.Provider
        value={{
          columns: tableColumns,
          onResizeStart: resizableColumns ? handleResizeStart : undefined,
          resizableColumns,
        }}
      >
        <div className="overflow-x-auto rounded-md border border-table-border bg-bg-surface">
          <table
            className={[
              'w-full border-collapse text-left [&_td:first-child]:pl-[var(--space-6)] [&_td:last-child]:pr-[var(--space-6)] [&_th:first-child]:pl-[var(--space-6)] [&_th:last-child]:pr-[var(--space-6)]',
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
}

export function TableHeaderCell({
  children,
  className,
  columnIndex,
  ...props
}: TableHeaderCellProps) {
  const { columns, onResizeStart, resizableColumns } =
    useContext(TableResizeContext);
  const canResize =
    resizableColumns &&
    columnIndex !== undefined &&
    columnIndex < columns.length - 1;

  return (
    <th
      className={[
        'relative h-10 bg-surface-subtle px-4 text-caption-web font-normal text-table-header-text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      scope="col"
      {...props}
    >
      {children}
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
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  const density = useContext(TableDensityContext);

  return (
    <td
      className={[
        tableCellHeightClassName[density],
        'px-4 text-caption-web text-table-body-text transition-[height] duration-200 ease-out motion-reduce:transition-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </td>
  );
}

export function TableRow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={[
        'border-b border-table-divider bg-bg-surface transition-[height,background-color] duration-200 ease-out hover:bg-surface-subtle last:border-b-0 motion-reduce:transition-none',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableEmpty({ children, colSpan, ...props }: TableStateProps) {
  return (
    <td
      className="align-middle px-4 text-body-web font-medium text-text-secondary"
      colSpan={colSpan}
      style={stateCellStyle}
      {...props}
    >
      <div style={stateContentStyle}>
        {children ?? '표시할 데이터가 없습니다'}
      </div>
    </td>
  );
}

export function TableLoading({ colSpan, ...props }: TableStateProps) {
  return (
    <td
      className="align-middle px-4 text-body-sm-web font-medium text-text-secondary"
      colSpan={colSpan}
      style={stateCellStyle}
      {...props}
    >
      <div
        style={{
          ...stateContentStyle,
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <LoaderCircle
          aria-hidden="true"
          className="size-5 animate-spin motion-reduce:animate-none"
          style={{ animationDuration: '2s' }}
          strokeWidth={2}
        />
        데이터를 불러오는 중...
      </div>
    </td>
  );
}

export function TableError({
  colSpan,
  description = '잠시 후 다시 시도해 주세요.',
  title = '데이터를 불러오지 못했습니다',
  ...props
}: TableErrorProps) {
  return (
    <td
      className="align-middle px-4"
      colSpan={colSpan}
      style={stateCellStyle}
      {...props}
    >
      <div
        className="bg-bg-surface"
        role="alert"
        style={{ ...stateContentStyle, flexDirection: 'column' }}
      >
        <strong className="text-body-web font-medium text-status-danger-fg">
          {title}
        </strong>
        <span className="mt-1 text-caption-web text-text-secondary">
          {description}
        </span>
      </div>
    </td>
  );
}
