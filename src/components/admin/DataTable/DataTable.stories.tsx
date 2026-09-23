import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  DataTable,
  TableCell,
  TableEmpty,
  TableError,
  TableHeaderCell,
  TableLoading,
  TableRow,
} from './DataTable';

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
  <thead>
    <tr>
      <TableHeaderCell>주문 번호</TableHeaderCell>
      <TableHeaderCell>사용자</TableHeaderCell>
      <TableHeaderCell>상품명</TableHeaderCell>
      <TableHeaderCell>주문 일시</TableHeaderCell>
      <TableHeaderCell>상태</TableHeaderCell>
    </tr>
  </thead>
);

export const Default: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <TableRow>
          <TableCell>LC-20260923-001</TableCell>
          <TableCell>김런치</TableCell>
          <TableCell>점심 예약 쿠폰</TableCell>
          <TableCell>2026. 09. 23. 12:30</TableCell>
          <TableCell>사용 완료</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>LC-20260923-002</TableCell>
          <TableCell>박캐치</TableCell>
          <TableCell>점심 예약 쿠폰</TableCell>
          <TableCell>2026. 09. 23. 13:00</TableCell>
          <TableCell>사용 가능</TableCell>
        </TableRow>
      </tbody>
    </DataTable>
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable>
      {tableHeader}
      <tbody>
        <tr>
          <TableEmpty colSpan={5} />
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
          <TableLoading colSpan={5} />
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
          <TableError colSpan={5} />
        </tr>
      </tbody>
    </DataTable>
  ),
};
