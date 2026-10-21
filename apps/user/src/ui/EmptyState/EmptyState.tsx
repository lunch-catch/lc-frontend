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
// 빈 화면은 할 일이 하나뿐이라 크게 채우면 오히려 둔해 보여서, 마스코트와 제목을 한 단계 작게 두고
// 버튼도 화면 너비 대신 가운데 좁은 폭(240px)과 44px 높이로 둔다 (멘토링 피드백: 전체 크기가 큼)
const EmptyState = ({
  children,
  description,
  image,
  title,
}: EmptyStateProps) => {
  return (
    // 정확한 가운데는 눈에 조금 아래로 보여서, 아래 여백을 더 주어 묶음을 살짝 위로 올린다
    <section className="flex flex-1 flex-col items-center justify-center px-page pt-6 pb-20 text-center">
      {/* 마스코트 그림은 여백 없이 잘라 두어서 상자 크기가 곧 마스코트 크기다 */}
      <img alt="" className="size-20" height={80} src={image} width={80} />
      <h2 className="mt-4 text-h3-mobile font-bold text-text-primary">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 text-body-sm-mobile text-text-secondary">
          {description}
        </p>
      )}
      {children && (
        <div className="mt-6 flex w-full max-w-60 flex-col gap-2 [&>button]:h-11">
          {children}
        </div>
      )}
    </section>
  );
};

export default EmptyState;
