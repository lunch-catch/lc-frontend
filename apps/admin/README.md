# 런치캐치 관리자

런치캐치 운영자를 위한 관리자 웹 애플리케이션입니다. AI와 대화하며 광고 포스터 템플릿을 제작하고, 캠페인·회원·결제·포인트·정산 및 부정 노출을 관리합니다.

[프로젝트 README](../../README.md) · [개발 서버](https://admin.dev.lunchcatch.com)

## 목차

- [주요 기능](#주요-기능)
- [화면 미리보기](#화면-미리보기)
- [기술 스택](#기술-스택)
- [로컬 실행](#로컬-실행)
- [빌드](#빌드)
- [테스트와 코드 검사](#테스트와-코드-검사)

## 주요 기능

| 메뉴 | 주요 기능 |
| --- | --- |
| 대시보드 | 매출·회원·캠페인 지표와 추이, 이전 기간 비교 |
| 템플릿 관리 | AI 채팅·요소 선택으로 생성·수정, 버전 관리, 게시·재게시 |
| 캠페인 관리 | 캠페인 검색·필터, 상세 정보·실적·상태 이력 조회 |
| 포인트 / 정산 관리 | 정산 불일치 정정·종결, 포인트 조정, 결제·환불·충전 정책 관리 |
| 회원 관리 | 점주·사용자 목록과 가입 정보·계정 상태 조회 |
| 부정 관리 | 무효 노출 사유와 캠페인 경고 조회 |
| 관리자 계정 관리 | 관리자 목록 조회와 계정 발급 |

로그인한 `ADMIN`·`SUPER_ADMIN`이 이용하며, 관리자 계정 조회·발급은 `SUPER_ADMIN` 권한이 필요합니다.

라이트·다크 모드와 테이블 열 표시·순서·행 밀도 설정을 지원합니다.

## 화면 미리보기

**2026.10.26~27 개발 서버 · 라이트 모드** 기준입니다. 표시된 값은 테스트 데이터입니다.

### 대시보드

점주·사용자 현황의 최근 한달 지표와 추이입니다.

![점주 현황 대시보드의 주요 지표와 매출·캠페인·입점 추이](./docs/screenshots/dashboard-owners.png)

<details open>
<summary>사용자 현황 대시보드 보기</summary>

![사용자 현황 대시보드의 이용 지표와 회원 추이](./docs/screenshots/dashboard-members.png)

</details>

### 템플릿 관리와 편집

템플릿을 검색하고 게시·활성 상태와 최종 수정 정보를 확인합니다.

![템플릿 검색·정렬·상태 필터와 포스터 미리보기 목록](./docs/screenshots/templates.png)

AI 대화, 포스터 미리보기, HTML 코드를 함께 보며 편집합니다.

![대화 이력과 포스터 미리보기·HTML 코드가 나란히 배치된 템플릿 편집기](./docs/screenshots/template-editor.png)

### 다른 관리 화면

<details open>
<summary>캠페인 관리</summary>

![캠페인 목록의 검색 필터·상태 뱃지·실적 열](./docs/screenshots/campaigns.png)

</details>

<details open>
<summary>회원 관리 · 점주 / 사용자</summary>

![점주 회원 목록과 가입일·상태·가게 등록 정보](./docs/screenshots/members-owners.png)

![사용자 회원 목록과 가입 정보·상태 필터](./docs/screenshots/members-users.png)

</details>

<details open>
<summary>포인트 / 정산 관리 · 정산 검증 / 포인트 변동 내역 / 충전 정책</summary>

정산 불일치를 조회하고 상세 패널에서 포인트 정정 또는 조정 없는 종결을 진행합니다.

![정산 불일치 목록의 기준 금액·실제 금액·차액과 처리 상태](./docs/screenshots/settlements.png)

![정산 불일치 상세 패널의 대상 정보와 금액 비교](./docs/screenshots/settlement-detail.png)

![대상 점주를 고정하고 지급·차감 금액을 입력하는 정산 불일치 정정 모달](./docs/screenshots/point-adjustment.png)

![포인트 잔액을 바꾸지 않는 조정 없는 종결 확인창](./docs/screenshots/settlement-close.png)

점주별 포인트 변동 내역과 기간별 합계를 조회합니다.

![점주별 개별 포인트 변동 내역과 기간별 합계](./docs/screenshots/point-ledger.png)

![현재 충전 정책과 정책 변경 이력](./docs/screenshots/point-policy.png)

</details>

<details open>
<summary>부정 관리 · 무효 노출 / 캠페인 경고</summary>

![무효 노출 사유 안내와 캠페인·사용자별 조회 필터](./docs/screenshots/fraud-impressions.png)

![캠페인 경고 목록의 무효 비율·회원 집중도·경고 뱃지](./docs/screenshots/fraud-warnings.png)

</details>

<details open>
<summary>관리자 계정 관리</summary>

![관리자 ID·이름 검색과 권한 목록 및 계정 발급 버튼](./docs/screenshots/admin-accounts.png)

</details>

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| UI | React 19, TypeScript, React Router |
| 개발·빌드 | Vite 8, pnpm Workspaces, Turborepo |
| 스타일·공통 컴포넌트 | Tailwind CSS, `@repo/ui`, Lucide React |
| API·상태 | Fetch API, React Hooks, Context, URL 쿼리 |
| Markdown·목록 렌더링 | React Markdown, remark-gfm, TanStack Virtual |
| 코드 검사·테스트 | TypeScript, ESLint, Prettier, Node.js Test Runner, Storybook |

## 로컬 실행

### 준비 사항

- Vite 8의 요구 버전을 충족하는 Node.js: `20.19+` 또는 `22.12+`
- 루트 `package.json`의 `packageManager`에 지정된 pnpm
- 실행 중인 런치캐치 백엔드와 로그인 가능한 관리자 계정

아래 명령은 모두 **`lc-frontend` 루트**에서 실행합니다.

### 1. 의존성 설치

```bash
corepack enable pnpm
pnpm install
```

### 2. 환경 변수 설정

`apps/admin/.env.local` 파일을 만들고 백엔드 주소를 설정합니다.

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

주소에는 `/v1/admin`을 붙이지 않습니다. 환경 변수 변경 후 개발 서버를 다시 실행합니다.

### 3. 관리자 앱 실행

```bash
pnpm dev:admin
```

접속: http://localhost:5175

쿠키 인증을 위해 백엔드가 프론트 주소를 허용해야 하며, `localhost`와 `127.0.0.1`을 혼용하지 않습니다.

## 빌드

```bash
pnpm --filter admin build
pnpm --filter admin preview
```

빌드 결과는 `apps/admin/dist`에 생성됩니다.

## 테스트와 코드 검사

```bash
pnpm --filter admin typecheck
pnpm --filter admin lint
pnpm --filter admin test
```
