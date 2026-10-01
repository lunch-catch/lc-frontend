import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import type { TableDensity } from '@admin/components/DataTable/DataTable';

import { TableDensityControl } from './TableDensityControl';

const meta = {
  component: TableDensityControl,
  title: 'Admin/TableDensityControl',
  args: {
    onValueChange: () => {},
    value: 'normal',
  },
  render: (args) => {
    const [value, setValue] = useState<TableDensity>(args.value);
    return (
      <TableDensityControl {...args} value={value} onValueChange={setValue} />
    );
  },
} satisfies Meta<typeof TableDensityControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {};
export const Compact: Story = { args: { value: 'compact' } };
export const Comfortable: Story = { args: { value: 'comfortable' } };
