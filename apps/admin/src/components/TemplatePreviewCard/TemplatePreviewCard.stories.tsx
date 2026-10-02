import type { Meta, StoryObj } from '@storybook/react-vite';

import { createMockTemplateVersion } from '@admin/features/template/templateData';

import { TemplatePreviewCard } from './TemplatePreviewCard';

const publishedVersion = createMockTemplateVersion({
  name: '가을 신메뉴',
  request: '가을 신메뉴 포스터를 만들어줘',
  themeIndex: 0,
  version: 1,
});

const meta = {
  component: TemplatePreviewCard,
  title: 'Admin/TemplatePreviewCard',
  args: {
    onActivationRequest: () => {},
    template: {
      createdAt: '2026-10-02 09:40',
      draftVersions: [],
      id: 'TPL-0012',
      isActive: true,
      name: '가을 신메뉴',
      publishedVersion,
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
      draftVersions: [
        createMockTemplateVersion({
          name: '오늘의 점심 특가',
          request: '오늘의 점심 특가 포스터를 만들어줘',
          themeIndex: 1,
          version: 1,
        }),
      ],
      isActive: false,
      name: '오늘의 점심 특가',
      publishedVersion: null,
      status: 'DRAFT',
      usageCount: 0,
    },
  },
};
