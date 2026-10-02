import type { Meta, StoryObj } from '@storybook/react-vite';

import { TemplatePreviewEmptyState } from './TemplatePreviewEmptyState';

const meta = {
  component: TemplatePreviewEmptyState,
  title: 'Admin/TemplatePreviewEmptyState',
} satisfies Meta<typeof TemplatePreviewEmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="aspect-[210/297] h-[560px]">
      <TemplatePreviewEmptyState />
    </div>
  ),
};
