import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilterBar } from '@admin/ui/FilterBar/FilterBar';

import { DataTable, type DataTableColumn } from './index';
import { useTableColumnSettings } from './useTableColumnSettings';

const meta = {
  title: 'Admin/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const tableHeader = (
  <DataTable.Header>
    <tr>
      <DataTable.HeaderCell>주문 번호</DataTable.HeaderCell>
      <DataTable.HeaderCell>사용자</DataTable.HeaderCell>
      <DataTable.HeaderCell>상품명</DataTable.HeaderCell>
      <DataTable.HeaderCell>주문 일시</DataTable.HeaderCell>
      <DataTable.HeaderCell>상태</DataTable.HeaderCell>
    </tr>
  </DataTable.Header>
);

export const Default: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <DataTable.Row>
          <DataTable.Cell>LC-20260923-001</DataTable.Cell>
          <DataTable.Cell>김런치</DataTable.Cell>
          <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
          <DataTable.Cell>2026. 09. 23. 12:30</DataTable.Cell>
          <DataTable.Cell>사용 완료</DataTable.Cell>
        </DataTable.Row>
        <DataTable.Row>
          <DataTable.Cell>LC-20260923-002</DataTable.Cell>
          <DataTable.Cell>박캐치</DataTable.Cell>
          <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
          <DataTable.Cell>2026. 09. 23. 13:00</DataTable.Cell>
          <DataTable.Cell>사용 가능</DataTable.Cell>
        </DataTable.Row>
      </tbody>
    </DataTable>
  ),
};

export const InternalScroll: Story = {
  render: () => (
    <div>
      <DataTable scrollMaxHeight="15rem">
        {tableHeader}
        <tbody>
          {Array.from({ length: 20 }, (_, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>{index + 1}</DataTable.Cell>
              <DataTable.Cell>김런치</DataTable.Cell>
              <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
              <DataTable.Cell>2026. 10. 14. 12:30</DataTable.Cell>
              <DataTable.Cell>사용 가능</DataTable.Cell>
            </DataTable.Row>
          ))}
        </tbody>
      </DataTable>
    </div>
  ),
};

export const ColumnAlignment: Story = {
  render: function ColumnAlignmentExample() {
    const columns: DataTableColumn[] = [
      { key: 'id', label: '점주 ID', align: 'left', width: '30%' },
      { key: 'status', label: '상태', align: 'center', width: '30%' },
      { key: 'amount', label: '충전 포인트', align: 'right', width: '40%' },
    ];
    const settings = useTableColumnSettings(
      'storybook.column-alignment',
      columns,
    );
    return (
      <>
        <FilterBar columnSettings={settings} />
        <DataTable columns={columns} columnSettings={settings}>
          <DataTable.Header>
            <tr>
              <DataTable.HeaderCell>점주 ID</DataTable.HeaderCell>
              <DataTable.HeaderCell>상태</DataTable.HeaderCell>
              <DataTable.HeaderCell
                onSortChange={() => {}}
                sortDirection="desc"
              >
                충전 포인트
              </DataTable.HeaderCell>
            </tr>
          </DataTable.Header>
          <tbody>
            <DataTable.Row>
              <DataTable.Cell>123</DataTable.Cell>
              <DataTable.Cell>활성</DataTable.Cell>
              <DataTable.Cell>10,000 P</DataTable.Cell>
            </DataTable.Row>
          </tbody>
        </DataTable>
      </>
    );
  },
};

export const ColumnPersonalization: Story = {
  render: function ColumnPersonalizationExample() {
    const columns = [
      { key: 'id', label: '주문 번호', width: '25%' },
      { key: 'user', label: '사용자', width: '15%' },
      { key: 'product', label: '상품명', width: '25%' },
      { key: 'date', label: '주문 일시', width: '20%' },
      { key: 'status', label: '상태', width: '15%' },
    ];
    const columnSettings = useTableColumnSettings('storybook.orders', columns);
    return (
      <>
        <FilterBar
          columnSettings={columnSettings}
          density={{ value: 'normal', onValueChange: () => {} }}
        />
        <DataTable
          columnSettings={columnSettings}
          columns={columns}
          resizableColumns
          className="table-fixed"
        >
          {tableHeader}
          <tbody>
            <DataTable.Row>
              <DataTable.Cell>LC-20260923-001</DataTable.Cell>
              <DataTable.Cell>김런치</DataTable.Cell>
              <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
              <DataTable.Cell>2026. 09. 23. 12:30</DataTable.Cell>
              <DataTable.Cell>사용 완료</DataTable.Cell>
            </DataTable.Row>
          </tbody>
        </DataTable>
      </>
    );
  },
};

export const ColumnWidths: Story = {
  render: () => (
    <DataTable
      className="table-fixed"
      columns={[
        { width: '18%' },
        { width: '16%' },
        { width: '28%' },
        { width: '24%' },
        { width: '14%' },
      ]}
    >
      {tableHeader}
      <tbody>
        <DataTable.Row>
          <DataTable.Cell>LC-20260923-001</DataTable.Cell>
          <DataTable.Cell>김런치</DataTable.Cell>
          <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
          <DataTable.Cell>2026. 09. 23. 12:30</DataTable.Cell>
          <DataTable.Cell>사용 완료</DataTable.Cell>
        </DataTable.Row>
      </tbody>
    </DataTable>
  ),
};

export const Densities: Story = {
  render: () => (
    <div className="space-y-4">
      {[
        { label: '축약 40px', value: 'compact' as const },
        { label: '일반 48px', value: 'normal' as const },
        { label: '여유 56px', value: 'comfortable' as const },
      ].map(({ label, value }) => (
        <div key={value}>
          <p className="mb-2 text-caption-web text-text-secondary">{label}</p>
          <DataTable density={value}>
            {tableHeader}
            <tbody>
              <DataTable.Row>
                <DataTable.Cell>LC-20260923-001</DataTable.Cell>
                <DataTable.Cell>김런치</DataTable.Cell>
                <DataTable.Cell>점심 예약 쿠폰</DataTable.Cell>
                <DataTable.Cell>2026. 09. 23. 12:30</DataTable.Cell>
                <DataTable.Cell>사용 완료</DataTable.Cell>
              </DataTable.Row>
            </tbody>
          </DataTable>
        </div>
      ))}
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <tr>
          <DataTable.Empty colSpan={5} />
        </tr>
      </tbody>
    </DataTable>
  ),
};

export const Loading: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <tr>
          <DataTable.Loading colSpan={5} />
        </tr>
      </tbody>
    </DataTable>
  ),
};

export const Error: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <tr>
          <DataTable.Error colSpan={5} />
        </tr>
      </tbody>
    </DataTable>
  ),
};

export const ErrorWithRetry: Story = {
  render: function ErrorWithRetryExample() {
    const [attempts, setAttempts] = useState(0);
    return (
      <>
        <DataTable>
          {tableHeader}
          <tbody>
            <tr>
              <DataTable.Error
                colSpan={5}
                description="서버에 연결하지 못했습니다."
                onRetry={() => setAttempts((value) => value + 1)}
              />
            </tr>
          </tbody>
        </DataTable>
        <p role="status">재시도 요청 {attempts}회</p>
      </>
    );
  },
};

export const ErrorWaitingToRetry: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <tr>
          <DataTable.Error
            colSpan={5}
            description="잠시 후 다시 시도해 주세요."
            onRetry={() => {}}
            retryDisabled
          />
        </tr>
      </tbody>
    </DataTable>
  ),
};

const responsiveColumns: DataTableColumn[] = [
  { key: 'id', label: '주문 번호', minWidth: 160 },
  { key: 'name', label: '사용자', minWidth: 120 },
  { key: 'product', label: '상품명', minWidth: 240 },
  { key: 'date', label: '주문 일시', minWidth: 180 },
  { key: 'status', label: '상태', minWidth: 120 },
];
const ResponsiveExample = ({
  internalScroll = false,
}: {
  internalScroll?: boolean;
}) => {
  const settings = useTableColumnSettings(
    'storybook.responsive',
    responsiveColumns,
  );
  return (
    <div className="w-full max-w-sm">
      <FilterBar columnSettings={settings} />
      <DataTable
        columns={responsiveColumns}
        columnSettings={settings}
        scrollMaxHeight={internalScroll ? '15rem' : undefined}
        resizableColumns
      >
        {tableHeader}
        <tbody>
          {Array.from({ length: internalScroll ? 20 : 3 }, (_, index) => (
            <DataTable.Row key={index}>
              <DataTable.Cell>LC-20261021-{index + 1}</DataTable.Cell>
              <DataTable.Cell>김런치</DataTable.Cell>
              <DataTable.Cell>
                긴 상품명도 페이지 너비를 늘리지 않고 말줄임 처리합니다.
              </DataTable.Cell>
              <DataTable.Cell>2026. 10. 21. 12:30</DataTable.Cell>
              <DataTable.Cell>사용 가능</DataTable.Cell>
            </DataTable.Row>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
};

export const Responsive: Story = { render: () => <ResponsiveExample /> };
export const ResponsiveInternalScroll: Story = {
  render: () => <ResponsiveExample internalScroll />,
};
