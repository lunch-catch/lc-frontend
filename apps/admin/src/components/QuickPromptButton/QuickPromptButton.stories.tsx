import type { Meta, StoryObj } from '@storybook/react-vite';

import { QuickPromptButton } from './QuickPromptButton';

const meta = {
  component: QuickPromptButton,
  title: 'Admin/QuickPromptButton',
  args: {
    label: '따뜻한 색감의 한식 점심 할인 포스터로 만들어줘',
    onClick: () => {},
  },
} satisfies Meta<typeof QuickPromptButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
