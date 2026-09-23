import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AdminSidebar } from './AdminSidebar';

const meta = {
  title: 'Admin/AdminSidebar',
  component: AdminSidebar,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof AdminSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

function AdminSidebarExample() {
  const [activeItemId, setActiveItemId] = useState('dashboard');

  return (
    <AdminSidebar activeItemId={activeItemId} onItemSelect={setActiveItemId} />
  );
}

export const Default: Story = {
  render: () => <AdminSidebarExample />,
};

export const CampaignSelected: Story = {
  args: {
    activeItemId: 'campaign',
  },
};
