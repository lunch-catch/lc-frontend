import type { Meta, StoryObj } from '@storybook/react-vite';

import { TemplateChatBubble } from './TemplateChatBubble';

const meta = {
  component: TemplateChatBubble,
  title: 'Admin/TemplateChatBubble',
  args: {
    children: '요청 내용을 반영해 미리보기를 업데이트했어요.',
    variant: 'assistant',
  },
  decorators: [
    (Story) => (
      <div className="flex w-80 flex-col gap-4 bg-bg-page p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TemplateChatBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Assistant: Story = {};
export const User: Story = {
  args: {
    children: '따뜻한 색감의 한식 점심 할인 포스터로 만들어줘',
    variant: 'user',
  },
};

export const Loading: Story = {
  args: {
    variant: 'loading',
  },
};
