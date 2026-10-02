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
    children: '처음부터 다시 보기',
    size: 'medium',
    variant: 'ghost',
  },
};
