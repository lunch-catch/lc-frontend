import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { PaginationSummary } from './PaginationSummary';

const meta = {
  title: 'Admin/PaginationSummary',
  component: PaginationSummary,
  args: {
    totalCount: 128,
    pageSize: 10,
  },
  parameters: {
    layout: 'padded',
  },
  render: (args) => {
    // 선택 결과를 다시 props에 반영해 고정 선택지의 실제 변경 동작을 보여준다.
    const [pageSize, setPageSize] = useState(args.pageSize);

    return (
      <PaginationSummary
        {...args}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
      />
    );
  },
} satisfies Meta<typeof PaginationSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// 0건이어도 개수 선택 컨트롤은 유지한다.
export const Empty: Story = {
  args: { totalCount: 0 },
};
