import { SegmentedControl, type SegmentedControlItem } from '@repo/ui';
import { Rows2, Rows3, Rows4 } from 'lucide-react';

import type { TableDensity } from '@admin/components/DataTable';

export interface TableDensityControlProps {
  onValueChange: (value: TableDensity) => void;
  value: TableDensity;
}

// 높이 표시는 DataTable의 compact·normal·comfortable 디자인 토큰과 맞춘다.
const densityItems: SegmentedControlItem<TableDensity>[] = [
  {
    icon: <Rows4 aria-hidden="true" className="size-4" />,
    iconOnly: true,
    label: '축약 보기 (40px)',
    value: 'compact',
  },
  {
    icon: <Rows3 aria-hidden="true" className="size-4" />,
    iconOnly: true,
    label: '일반 보기 (48px)',
    value: 'normal',
  },
  {
    icon: <Rows2 aria-hidden="true" className="size-4" />,
    iconOnly: true,
    label: '여유 보기 (56px)',
    value: 'comfortable',
  },
];

export const TableDensityControl = ({
  onValueChange,
  value,
}: TableDensityControlProps) => (
  <SegmentedControl
    ariaLabel="테이블 행 높이"
    items={densityItems}
    onValueChange={onValueChange}
    value={value}
  />
);
