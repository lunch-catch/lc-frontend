import type { Meta, StoryObj } from '@storybook/react-vite';

import ActionButton from './ActionButton';

const meta = {
  title: 'User/ActionButton',
  component: ActionButton,
  args: {
    children: '계속하기',
    size: 'large',
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
} satisfies Meta<typeof ActionButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Large: Story = {};

export const Medium: Story = {
  args: {
    size: 'medium',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Ghost: Story = {
  args: {
    children: '주변 가게 둘러보기',
    size: 'medium',
    variant: 'ghost',
  },
};

// 찜 목록처럼 같은 버튼이 여러 번 나올 때 쓰는 연한 주요 행동
export const Soft: Story = {
  args: {
    children: '받기',
    size: 'medium',
    variant: 'soft',
  },
};

// 확인 창의 취소처럼 옆 버튼보다 한 단계 낮은 행동
export const Secondary: Story = {
  args: {
    children: '취소',
    variant: 'secondary',
  },
};

// 카드 안의 버튼처럼 색 없이 두는 행동
export const Outline: Story = {
  args: {
    children: 'QR 보기',
    variant: 'outline',
  },
};

// 삭제처럼 되돌릴 수 없는 행동
export const Danger: Story = {
  args: {
    children: '삭제',
    variant: 'danger',
  },
};
