import type { Meta, StoryObj } from '@storybook/react-vite';

import TopBar from './TopBar';

const meta = {
  title: 'User/TopBar',
  component: TopBar,
  args: {
    title: '약관 동의',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 390 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof TopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithBack: Story = {
  args: {
    onBack: () => undefined,
  },
};

export const TitleOnly: Story = {};

export const WithAction: Story = {
  args: {
    title: '찜 목록',
    tone: 'page',
    action: (
      <button
        className="flex h-11 items-center px-2.5 text-body-sm-mobile font-medium text-text-secondary"
        type="button"
      >
        쿠폰함
      </button>
    ),
  },
};
