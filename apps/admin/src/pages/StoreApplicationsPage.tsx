import {
  StoreApplicationsContent,
  type StoreApplicationsContentProps,
} from '@admin/features/merchant/StoreApplicationsContent';

export type StoreApplicationsPageProps = StoreApplicationsContentProps;

export const StoreApplicationsPage = (props: StoreApplicationsPageProps) => (
  <StoreApplicationsContent {...props} />
);
