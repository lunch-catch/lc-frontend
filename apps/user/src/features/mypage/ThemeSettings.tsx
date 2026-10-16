import { type ReactNode, useState } from 'react';
import { getTheme, SegmentedControl, setTheme, type Theme } from '@repo/ui';
import { Moon, Sun } from 'lucide-react';

import { cardClassName } from '@user/components/Card/Card';

const themeItems = [
  {
    value: 'light',
    label: '라이트',
    icon: <Sun aria-hidden="true" className="size-4" />,
  },
  {
    value: 'dark',
    label: '다크',
    icon: <Moon aria-hidden="true" className="size-4" />,
  },
] satisfies { value: Theme; label: string; icon: ReactNode }[];

// 화면 모드. 처음에는 기기 설정을 따르고, 한 번 고르면 그 값을 이 기기에 저장해 유지한다
// 공통 테마 기능에 기기 설정으로 되돌리는 방법이 없어서 라이트와 다크만 고른다
const ThemeSettings = () => {
  const [theme, setCurrentTheme] = useState(getTheme);

  const handleChange = (nextTheme: Theme) => {
    setTheme(nextTheme);
    setCurrentTheme(nextTheme);
  };

  return (
    <section aria-labelledby="theme-settings-title">
      <h2
        className="mb-2 px-1 text-body-sm-mobile font-bold text-text-primary"
        id="theme-settings-title"
      >
        화면
      </h2>
      <div
        className={`flex items-center justify-between gap-3 px-4 py-3 ${cardClassName}`}
      >
        <p className="text-body-sm-mobile font-medium text-text-primary">
          화면 모드
        </p>
        <SegmentedControl
          ariaLabel="화면 모드"
          items={themeItems}
          onValueChange={handleChange}
          value={theme}
        />
      </div>
    </section>
  );
};

export default ThemeSettings;
