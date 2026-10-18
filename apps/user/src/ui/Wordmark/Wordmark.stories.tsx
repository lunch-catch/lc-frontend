import type { Meta, StoryObj } from '@storybook/react-vite';

import Wordmark from './Wordmark';

const meta = {
  title: 'User/Wordmark',
  component: Wordmark,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Medium: Story = {};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};
