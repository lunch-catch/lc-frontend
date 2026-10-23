import { BottomSheet } from '@repo/ui';

import type { TermsItem } from '@user/api/terms';

interface TermsSheetProps {
  // 펼쳐 볼 약관. null이면 닫혀 있다
  terms: TermsItem | null;
  onClose: () => void;
}

// 약관 내용을 보여주는 아래 시트. 약관 동의 화면과 로그인 화면의 이용약관 링크가 같이 쓴다
const TermsSheet = ({ onClose, terms }: TermsSheetProps) => (
  <BottomSheet isOpen={terms !== null} onClose={onClose} title={terms?.title}>
    {/* 내용이 길어도 시트가 화면을 넘지 않도록 내용 영역만 스크롤한다 */}
    <div
      aria-label={`${terms?.title ?? '약관'} 내용`}
      className="flex max-h-[60dvh] flex-col gap-4 overflow-y-auto"
      role="region"
      tabIndex={0}
    >
      <p className="text-caption-mobile text-text-secondary">
        버전 {terms?.version}
      </p>
      {terms?.sections.map((section) => (
        <section className="flex flex-col gap-1" key={section.heading}>
          <h3 className="text-body-sm-mobile font-bold text-text-primary">
            {section.heading}
          </h3>
          <ul className="list-disc pl-5 text-body-sm-mobile leading-relaxed text-text-secondary">
            {section.items.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  </BottomSheet>
);

export default TermsSheet;
