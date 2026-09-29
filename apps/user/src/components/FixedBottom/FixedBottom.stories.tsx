import type { Meta, StoryObj } from '@storybook/react-vite';

import ActionButton from '@user/components/ActionButton/ActionButton';

import FixedBottom from './FixedBottom';

const meta = {
  title: 'User/FixedBottom',
  component: FixedBottom,
  args: {
    children: <ActionButton size="large">동의하고 계속하기</ActionButton>,
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FixedBottom>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
