import type {
  CSSProperties,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';
import { LoaderCircle } from 'lucide-react';

export type DataTableProps = TableHTMLAttributes<HTMLTableElement>;
export type TableHeaderCellProps = ThHTMLAttributes<HTMLTableCellElement>;
export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

interface TableStateProps extends TdHTMLAttributes<HTMLTableCellElement> {
  colSpan: number;
}

interface TableErrorProps extends TableStateProps {
  description?: string;
  title?: string;
}

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

export function DataTable({ children, className, ...props }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-table-border bg-bg-surface">
      <table
        className={['w-full border-collapse text-left', className]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </table>
    </div>
  );
}

export function TableHeaderCell({
  children,
  className,
  ...props
}: TableHeaderCellProps) {
  return (
    <th
      className={[
        'h-10 bg-surface-subtle px-4 text-caption-web font-normal text-table-header-text',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      scope="col"
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }: TableCellProps) {
  return (
    <td
      className={['h-14 px-4 text-caption-web text-table-body-text', className]
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
        'border-b border-table-divider bg-bg-surface hover:bg-surface-subtle last:border-b-0',
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
