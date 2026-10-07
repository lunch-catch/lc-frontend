import type { Meta, StoryObj } from '@storybook/react-vite';

import mascotAlert from '@user/assets/illustrations/mascot-alert.webp';
import mascotEmpty from '@user/assets/illustrations/mascot-empty.webp';
import ActionButton from '@user/components/ActionButton/ActionButton';

import EmptyState from './EmptyState';

const meta = {
  title: 'User/EmptyState',
  component: EmptyState,
  args: {
    image: mascotAlert,
    title: '오늘의 포스터를 모두 확인했어요',
    description: '마음에 든 포스터는 찜 목록에서 다시 볼 수 있어요',
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', width: 390, height: 600 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithActions: Story = {
  args: {
    children: (
      <>
        <ActionButton>찜한 포스터 보기</ActionButton>
        <ActionButton variant="ghost">주변 가게 둘러보기</ActionButton>
      </>
    ),
  },
};

export const TextOnly: Story = {
  args: {
    image: mascotEmpty,
    title: '찜한 포스터가 없어요',
    description: '스와이프에서 마음에 드는 포스터를 찜해 보세요',
  },
};
