import type { Meta, StoryObj } from '@storybook/react-vite';

import { FilterBar } from '@admin/components/FilterBar/FilterBar';

import { DataTable } from './index';

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

export const ColumnPersonalization: Story = {
  render: () => (
    <>
      <FilterBar
        tableKey="storybook.orders"
        density={{ value: 'normal', onValueChange: () => {} }}
      />
      <DataTable
        personalizationKey="storybook.orders"
        columns={[
          { key: 'id', label: '주문 번호', width: '25%' },
          { key: 'user', label: '사용자', width: '15%' },
          { key: 'product', label: '상품명', width: '25%' },
          { key: 'date', label: '주문 일시', width: '20%' },
          { key: 'status', label: '상태', width: '15%' },
        ]}
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
  ),
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
