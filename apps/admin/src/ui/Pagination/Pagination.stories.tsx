import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination } from './Pagination';

const meta = {
  title: 'Admin/Pagination',
  component: Pagination,
  args: {
    currentPage: 1,
    totalPages: 20,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const PaginationExample = () => {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div style={{ width: '100%' }}>
      <Pagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalPages={20}
      />
    </div>
  );
};

export const Default: Story = {
  render: () => <PaginationExample />,
};

export const LastPage: Story = {
  args: {
    currentPage: 20,
  },
};

// 빈 목록과 단일 페이지에서는 이동 컨트롤이 렌더링되지 않는 상태를 보여준다.
export const SinglePage: Story = {
  args: {
    totalPages: 1,
  },
};

export const Empty: Story = {
  args: {
    totalPages: 0,
  },
};
