import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Pagination } from './Pagination';

const meta = {
  title: 'Admin/Pagination',
  component: Pagination,
  args: {
    currentPage: 1,
    totalCount: 128,
    totalPages: 20,
  },
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <div style={{ width: '100%' }}>
      <Pagination
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalCount={128}
        totalPages={20}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <PaginationExample />,
};

export const LastPage: Story = {
  args: {
    currentPage: 20,
    totalCount: 200,
  },
};
