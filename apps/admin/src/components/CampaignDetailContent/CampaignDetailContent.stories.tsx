import type { Meta, StoryObj } from '@storybook/react-vite';

import { campaigns } from '@admin/features/campaign/campaignData';

import { CampaignDetailContent } from './CampaignDetailContent';

const meta = {
  component: CampaignDetailContent,
  title: 'Admin/CampaignDetailContent',
} satisfies Meta<typeof CampaignDetailContent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = { args: { campaign: campaigns[0] } };
export const Paused: Story = { args: { campaign: campaigns[1] } };
