import { useState } from 'react';
import type { Theme } from '@repo/ui';
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

function AdminSidebarExample({
  initialTheme = 'light',
}: {
  initialTheme?: Theme;
}) {
  const [activeItemId, setActiveItemId] = useState('dashboard');
  const [theme, setTheme] = useState<Theme>(initialTheme);

  return (
    <AdminSidebar
      activeItemId={activeItemId}
      onItemSelect={setActiveItemId}
      theme={theme}
      onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    />
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

export const DarkThemeToggle: Story = {
  render: () => <AdminSidebarExample initialTheme="dark" />,
};
