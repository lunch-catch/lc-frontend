import type { CSSProperties } from 'react';
import { LoaderCircle } from 'lucide-react';

import type { TableErrorProps, TableStateProps } from './dataTableTypes';

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

export const TableEmpty = ({
  children,
  colSpan,
  ...props
}: TableStateProps) => {
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
};

export const TableLoading = ({ colSpan, ...props }: TableStateProps) => {
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
};

export const TableError = ({
  colSpan,
  description = '잠시 후 다시 시도해 주세요.',
  title = '데이터를 불러오지 못했습니다',
  ...props
}: TableErrorProps) => {
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
};
