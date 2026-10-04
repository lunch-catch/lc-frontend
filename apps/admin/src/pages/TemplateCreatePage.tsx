import {
  TemplateCreateContent,
  type TemplateCreateContentProps,
} from '@admin/features/template/components/TemplateCreateContent';

export type TemplateCreatePageProps = TemplateCreateContentProps;

export const TemplateCreatePage = (props: TemplateCreatePageProps) => (
  <TemplateCreateContent {...props} />
);
