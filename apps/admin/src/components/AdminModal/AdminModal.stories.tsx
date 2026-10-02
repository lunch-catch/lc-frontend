import { useState } from 'react';
import { Button } from '@repo/ui';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AdminModal } from './AdminModal';

const meta = {
  component: AdminModal,
  title: 'Admin/AdminModal',
  args: {
    children: '모달 안에 표시할 콘텐츠입니다.',
    onClose: () => {},
    open: false,
    title: '템플릿 등록',
  },
} satisfies Meta<typeof AdminModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button onClick={() => setOpen(true)}>모달 열기</Button>
        <AdminModal {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
};
