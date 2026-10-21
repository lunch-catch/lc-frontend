import { type ComponentType, type SVGProps, useRef, useState } from 'react';
import type { Theme } from '@repo/ui';
import {
  CircleDollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  ShieldAlert,
  Sun,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';

type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

const footerButtonClassName =
  'flex h-8 w-full items-center justify-start gap-3 rounded-md px-[13px] text-caption-web font-medium text-text-secondary transition-colors hover:bg-surface-subtle hover:text-text-primary active:bg-surface-subtle active:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary disabled:pointer-events-none disabled:opacity-50';

export interface AdminNavigationItem {
  icon: NavigationIcon;
  id: string;
  label: string;
}

export interface AdminSidebarProps {
  admin?: {
    name: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
  };
  activeItemId?: string;
  items?: AdminNavigationItem[];
  onItemSelect?: (itemId: string) => void;
  onLogout?: () => void;
  logoutDisabled?: boolean;
  theme?: Theme;
  onThemeToggle?: () => void | Promise<void>;
}

const defaultNavigationItems: AdminNavigationItem[] = [
  { icon: LayoutDashboard, id: 'dashboard', label: '대시보드' },
  { icon: Megaphone, id: 'campaign', label: '캠페인 관리' },
  { icon: FileText, id: 'template', label: '템플릿 관리' },
  { icon: CircleDollarSign, id: 'settlement', label: '포인트/정산 관리' },
  { icon: Users, id: 'member', label: '회원 관리' },
  { icon: ShieldAlert, id: 'fraud', label: '부정 관리' },
  { icon: UserCog, id: 'account', label: '계정 관리' },
];

/**
 * 관리자 탐색 메뉴와 계정·테마·로그아웃 버튼을 표시하는 사이드바입니다.
 * 로그아웃 확인과 서버 요청은 onLogout을 통해 상위 화면에 위임합니다.
 * @param props 메뉴 선택 상태, 관리자 정보 및 하단 버튼의 동작과 비활성화 설정
 * @returns 마우스 진입 시 펼쳐지는 관리자 사이드바
 */
export function AdminSidebar({
  admin,
  activeItemId = 'dashboard',
  items = defaultNavigationItems,
  onItemSelect,
  onLogout,
  logoutDisabled = false,
  theme = 'light',
  onThemeToggle,
}: AdminSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const visibleItems = items.filter(
    (item) => item.id !== 'account' || admin?.role === 'SUPER_ADMIN',
  );
  const sidebarRef = useRef<HTMLElement>(null);
  const isThemeTogglePending = useRef(false);
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const themeToggleLabel =
    theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
  const handleThemeToggle = async () => {
    if (isThemeTogglePending.current) return;

    isThemeTogglePending.current = true;
    try {
      await onThemeToggle?.();
    } finally {
      // 스냅샷이 제거된 다음 프레임의 실제 hover로 펼침 상태를 복원한다.
      requestAnimationFrame(() => {
        isThemeTogglePending.current = false;
        setIsExpanded(sidebarRef.current?.matches(':hover') ?? false);
      });
    }
  };

  // 레이아웃 안에서 실제 너비를 차지해 펼칠 때 메인 영역을 덮지 않고 밀어낸다.
  return (
    <aside
      ref={sidebarRef}
      className={`relative z-30 flex h-dvh shrink-0 flex-col gap-6 overflow-hidden bg-bg-surface pb-5 pt-4 transition-[width,box-shadow] duration-200 ease-out motion-reduce:transition-none ${
        isExpanded ? 'w-60 shadow-lg' : 'w-[72px]'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => {
        if (!isThemeTogglePending.current) setIsExpanded(false);
      }}
    >
      <div
        className="flex h-10 shrink-0 select-none items-center gap-3 overflow-hidden px-5"
        title="런치캐치 Admin"
      >
        <img
          src="/favicon-32.png"
          alt=""
          width={32}
          height={32}
          className="size-8 shrink-0"
        />
        <div
          className={`flex min-w-0 items-baseline gap-1.5 overflow-hidden whitespace-nowrap text-action-primary transition-[max-width,opacity] duration-200 ${
            isExpanded ? 'max-w-36 opacity-100' : 'max-w-0 opacity-0'
          }`}
        >
          <span className="text-h2-web font-extrabold tracking-tight">
            런치캐치
          </span>
          <span className="text-caption-web font-bold">Admin</span>
        </div>
      </div>
      <nav
        aria-label="관리자 메뉴"
        className="min-h-0 flex-1 overflow-y-auto px-4"
      >
        <ul className="flex flex-col gap-2">
          {visibleItems.map(({ icon: Icon, id, label }) => {
            const isSelected = id === activeItemId;

            return (
              <li className="w-full" key={id}>
                <button
                  aria-current={isSelected ? 'page' : undefined}
                  className={[
                    'flex h-10 w-full items-center justify-start gap-3 rounded-md px-[11px] text-left text-body-sm-web font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
                    isSelected
                      ? 'bg-surface-brand text-text-brand'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-action-primary',
                  ].join(' ')}
                  onClick={() => onItemSelect?.(id)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  <span
                    className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
                      isExpanded ? 'max-w-36 opacity-100' : 'max-w-0 opacity-0'
                    }`}
                  >
                    {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto px-4">
        <div className="mb-3 border-t border-border-subtle" />
        {admin && (
          <div
            className="mb-3 flex items-center gap-3 px-[13px] text-text-secondary"
            title={`${admin.name} · ${admin.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'}`}
          >
            <UserRound aria-hidden="true" className="size-4 shrink-0" />
            <div
              className={`min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
                isExpanded ? 'max-w-36 opacity-100' : 'max-w-0 opacity-0'
              }`}
            >
              <p className="truncate text-body-sm-web font-medium text-text-primary">
                {admin.name}
              </p>
              <p className="text-caption-web">
                {admin.role === 'SUPER_ADMIN' ? '최고 관리자' : '관리자'}
              </p>
            </div>
          </div>
        )}
        {onThemeToggle && (
          <button
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
            className={`mb-2 ${footerButtonClassName}`}
            onClick={() => void handleThemeToggle()}
            type="button"
          >
            <ThemeIcon aria-hidden="true" className="size-4 shrink-0" />
            <span
              className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${isExpanded ? 'max-w-48 opacity-100' : 'max-w-0 opacity-0'}`}
            >
              {themeToggleLabel}
            </span>
          </button>
        )}
        <button
          aria-label="로그아웃"
          disabled={logoutDisabled}
          className={footerButtonClassName}
          onClick={onLogout}
          type="button"
        >
          <LogOut aria-hidden="true" className="size-4 shrink-0" />
          <span
            className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${
              isExpanded ? 'max-w-24 opacity-100' : 'max-w-0 opacity-0'
            }`}
          >
            로그아웃
          </span>
        </button>
      </div>
    </aside>
  );
}
