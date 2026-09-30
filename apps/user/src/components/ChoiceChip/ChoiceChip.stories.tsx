import type { Meta, StoryObj } from '@storybook/react-vite';

import ChoiceChip from './ChoiceChip';

const meta = {
  title: 'User/ChoiceChip',
  component: ChoiceChip,
  args: {
    children: '30대',
    name: 'age-group',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 110 }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ChoiceChip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: {
    defaultChecked: true,
  },
};
