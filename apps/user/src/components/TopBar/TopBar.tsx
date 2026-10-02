import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';

export type TopBarTone = 'surface' | 'page';

export interface TopBarProps {
  title: string;
  onBack?: () => void;
  // 오른쪽 끝에 두는 버튼이나 링크
  action?: ReactNode;
  // surface: 흰 배경 (뒤로 가기가 있는 화면), page: 페이지와 같은 배경 (탭 안의 화면)
  tone?: TopBarTone;
}

const toneClassNames: Record<TopBarTone, string> = {
  surface: 'bg-bg-surface',
  page: 'bg-bg-page',
};

const TopBar = ({ action, onBack, title, tone = 'surface' }: TopBarProps) => {
  return (
    <header
      className={`flex h-14 items-center gap-3 px-page ${toneClassNames[tone]}`}
    >
      {onBack && (
        <button
          aria-label="뒤로 가기"
          className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-text-primary focus-visible:outline-2 focus-visible:outline-action-primary"
          onClick={onBack}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-6" />
        </button>
      )}
      <h1 className="min-w-0 flex-1 truncate text-h3-mobile font-bold text-text-primary">
        {title}
      </h1>
      {action && <div className="-mr-2.5 flex shrink-0">{action}</div>}
    </header>
  );
};

export default TopBar;
