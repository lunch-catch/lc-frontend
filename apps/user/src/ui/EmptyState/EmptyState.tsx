import type { ReactNode } from 'react';

export interface EmptyStateProps {
  // 마스코트 이미지 주소 (assets/illustrations/mascot-*.webp)
  image: string;
  title: string;
  description?: ReactNode;
  // 버튼 영역. 위에서부터 세로로 쌓인다
  children?: ReactNode;
}

// 보여줄 내용이 없을 때 마스코트, 안내 문구, 다음 행동 버튼을 보여주는 화면
const EmptyState = ({
  children,
  description,
  image,
  title,
}: EmptyStateProps) => {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-page py-6 text-center">
      <img alt="" className="size-40" height={160} src={image} width={160} />
      <h2 className="mt-6 text-h2-mobile font-bold text-text-primary">
        {title}
      </h2>
      {description && (
        <p className="mt-2 text-body-sm-mobile text-text-secondary">
          {description}
        </p>
      )}
      {children && (
        <div className="mt-9 flex w-full flex-col gap-3">{children}</div>
      )}
    </section>
  );
};

export default EmptyState;
