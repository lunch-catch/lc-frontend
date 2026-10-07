interface PendingManagementPageProps {
  title: string;
}

export const PendingManagementPage = ({
  title,
}: PendingManagementPageProps) => (
  <section className="rounded-xl border border-border-subtle bg-bg-surface p-6">
    <h2 className="text-title-sm-web font-semibold text-text-primary">
      {title}
    </h2>
    <p className="mt-2 text-body-sm-web text-text-secondary">
      화면 구현을 위한 관리자 공통 레이아웃입니다.
    </p>
  </section>
);
