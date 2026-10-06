import {
  TemplateManagementContent,
  type TemplateManagementContentProps,
} from '@admin/features/template/components/TemplateManagementContent';

export type TemplateManagementPageProps = TemplateManagementContentProps;

export const TemplateManagementPage = (props: TemplateManagementPageProps) => (
  <TemplateManagementContent {...props} />
);
