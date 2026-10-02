import type { Meta, StoryObj } from '@storybook/react-vite';

import { TemplatePreviewCard } from './TemplatePreviewCard';

const meta = {
  component: TemplatePreviewCard,
  title: 'Admin/TemplatePreviewCard',
  args: {
    onActivationRequest: () => {},
    template: {
      createdAt: '2026-10-02 09:40',
      id: 'TPL-0012',
      isActive: true,
      name: '가을 신메뉴',
      status: 'PUBLISHED',
      updatedAt: '2026-10-02 09:40',
      updatedBy: 'ADM-001',
      usageCount: 128,
    },
  },
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TemplatePreviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};
export const Draft: Story = {
  args: {
    template: {
      ...meta.args.template,
      isActive: false,
      name: '오늘의 점심 특가',
      status: 'DRAFT',
      usageCount: 0,
    },
  },
};
