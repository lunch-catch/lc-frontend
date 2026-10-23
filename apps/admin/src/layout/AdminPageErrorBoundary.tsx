import { Component, type ReactNode } from 'react';
import { Button } from '@repo/ui';

import { ErrorState } from '@admin/ui/ErrorState/ErrorState';

/** 본문 렌더링 오류를 격리해 페이지 코드 로딩 실패 후에도 공통 레이아웃을 유지한다. */
export class AdminPageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-40 flex-col items-center justify-center gap-4">
          <ErrorState
            title="페이지를 불러오지 못했습니다"
            description="페이지를 새로고침한 뒤 다시 이용해 주세요."
          />
          {/* lazy가 캐시한 실패 결과도 초기화하도록 문서 전체를 다시 불러온다. */}
          <Button variant="neutral" onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
