import { createContext } from 'react';

// 인증 계층에서 저장 대상 계정만 전달해 테이블 컴포넌트가 인증 로직에 의존하지 않도록 한다.
// 로그인 정보가 없는 화면(예: Storybook)은 메모리에서만 설정을 적용한다.
export const TableSettingsAccountContext = createContext<number | null>(null);
