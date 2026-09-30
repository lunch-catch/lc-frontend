import type { Meta, StoryObj } from '@storybook/react-vite';

import FeedbackToast from './FeedbackToast';

const meta = {
  title: 'User/FeedbackToast',
  component: FeedbackToast,
  args: {
    message: '찜 목록에 담았어요 · 11:00부터 받을 수 있어요',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 358 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FeedbackToast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Short: Story = {
  args: {
    message: '쿠폰이 발급되었어요',
  },
};
