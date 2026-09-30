import { MemoryRouter } from 'react-router';
import type { Meta, StoryObj } from '@storybook/react-vite';

import AppHeader from './AppHeader';

const meta = {
  title: 'User/AppHeader',
  component: AppHeader,
  args: {
    locationName: '강남역 주변',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ width: 390 }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof AppHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
