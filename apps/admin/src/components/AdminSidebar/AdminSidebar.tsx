import type { ComponentType, SVGProps } from 'react';
import {
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  ShieldAlert,
  Store,
  UserCog,
  Users,
} from 'lucide-react';

type NavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export interface AdminNavigationItem {
  icon: NavigationIcon;
  id: string;
  label: string;
}

export interface AdminSidebarProps {
  activeItemId?: string;
  items?: AdminNavigationItem[];
  onItemSelect?: (itemId: string) => void;
  onLogout?: () => void;
}

const defaultNavigationItems: AdminNavigationItem[] = [
  { icon: LayoutDashboard, id: 'dashboard', label: '대시보드' },
  { icon: Store, id: 'merchant', label: '입점 관리' },
  { icon: Users, id: 'member', label: '회원 관리' },
  { icon: Megaphone, id: 'campaign', label: '캠페인 관리' },
  { icon: FileText, id: 'template', label: '템플릿 관리' },
  { icon: CircleDollarSign, id: 'settlement', label: '포인트/정산 관리' },
  { icon: ShieldAlert, id: 'fraud', label: '부정 관리' },
  { icon: ClipboardCheck, id: 'review', label: '심사 관리' },
  { icon: UserCog, id: 'account', label: '계정 관리' },
];

export function AdminSidebar({
  activeItemId = 'dashboard',
  items = defaultNavigationItems,
  onItemSelect,
  onLogout,
}: AdminSidebarProps) {
  return (
    <aside className="flex min-h-screen w-60 shrink-0 flex-col gap-2 bg-bg-surface px-4 pb-6 pt-4">
      <nav aria-label="관리자 메뉴">
        <ul className="flex flex-col gap-2">
          {items.map(({ icon: Icon, id, label }) => {
            const isSelected = id === activeItemId;

            return (
              <li key={id}>
                <button
                  aria-current={isSelected ? 'page' : undefined}
                  className={[
                    'flex h-10 w-full items-center gap-2 rounded-md px-3 text-left text-body-sm-web font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary',
                    isSelected
                      ? 'bg-status-info-bg text-action-primary'
                      : 'text-text-secondary hover:bg-surface-subtle hover:text-action-primary',
                  ].join(' ')}
                  onClick={() => onItemSelect?.(id)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="size-[18px] shrink-0" />
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border-subtle" />
      <button
        className="flex h-10 items-center gap-2 text-caption-web font-medium text-text-secondary transition-colors hover:text-action-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action-primary"
        onClick={onLogout}
        type="button"
      >
        <LogOut aria-hidden="true" className="size-[18px]" />
        로그아웃
      </button>
    </aside>
  );
}
