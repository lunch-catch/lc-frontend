import { useState } from 'react';
import { Button } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AdminDrawer } from './AdminDrawer';

const meta = {
  component: AdminDrawer,
  title: 'Admin/AdminDrawer',
} satisfies Meta<typeof AdminDrawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: '상세 조회 콘텐츠',
    open: false,
    title: '상세 정보',
    onClose: () => {},
  },
  render: (args) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>상세 열기</Button>
        <AdminDrawer {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};
