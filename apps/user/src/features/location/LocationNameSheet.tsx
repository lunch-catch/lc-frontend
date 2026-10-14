import { type FormEvent, useState } from 'react';
import { BottomSheet } from '@repo/ui';

import ActionButton from '@user/components/ActionButton/ActionButton';

// 서버가 받는 위치 이름의 최대 길이
const NICKNAME_MAX_LENGTH = 50;

export interface LocationNameSheetProps {
  saving: boolean;
  // 저장하지 못했을 때 시트 안에 보여줄 안내
  errorMessage: string | null;
  onClose: () => void;
  // 이름을 비워 두면 undefined로 넘긴다
  onSave: (nickname: string | undefined) => void;
}

// GPS로 찾은 위치에 이름을 붙여 저장하는 시트
// 카카오 지도가 붙기 전에는 주소를 알 수 없어서, 사용자가 붙인 이름으로 위치를 알아보게 한다
// 닫힐 때 화면에서 빠져 입력한 이름도 함께 지워진다
const LocationNameSheet = ({
  errorMessage,
  onClose,
  onSave,
  saving,
}: LocationNameSheetProps) => {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    onSave(nickname.trim() || undefined);
  };

  return (
    <BottomSheet isOpen onClose={onClose} title="위치 이름">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm-mobile text-text-secondary">
            어떤 곳인지 이름을 붙여 주세요
          </span>
          {/* iOS가 입력할 때 화면을 확대하지 않도록 글자를 16px로 둔다 */}
          <input
            autoComplete="off"
            className="h-12 rounded-lg border border-border-subtle bg-bg-surface px-3 text-body-mobile text-text-primary placeholder:text-text-tertiary focus:border-action-primary focus:outline-none"
            maxLength={NICKNAME_MAX_LENGTH}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="예: 회사"
            value={nickname}
          />
        </label>
        {errorMessage && (
          <p className="text-caption-mobile text-status-danger-fg" role="alert">
            {errorMessage}
          </p>
        )}
        <ActionButton loading={saving} size="large" type="submit">
          저장
        </ActionButton>
      </form>
    </BottomSheet>
  );
};

export default LocationNameSheet;
