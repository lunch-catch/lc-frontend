import { type FormEvent, useState } from 'react';
import { BottomSheet } from '@repo/ui';

import { type MyProfile, updateMyProfile } from '@user/api/member';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import HintInput from '@user/ui/HintInput/HintInput';

// 서버가 받는 닉네임 길이 (1~20자, 공백만은 안 된다)
const NICKNAME_MAX_LENGTH = 20;

interface NicknameSheetProps {
  nickname: string;
  onClose: () => void;
  onSaved: (profile: MyProfile) => void;
}

// 닉네임 바꾸기. 지금 닉네임을 채워 두고, 바뀐 값이 있을 때만 저장할 수 있다
// 닫힐 때 화면에서 빠져 입력한 값도 함께 지워진다
const NicknameSheet = ({ nickname, onClose, onSaved }: NicknameSheetProps) => {
  const [value, setValue] = useState(nickname);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  const nextNickname = value.trim();
  const canSave = nextNickname.length > 0 && nextNickname !== nickname;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSave || isSaving) return;

    setIsSaving(true);
    setHasError(false);
    try {
      onSaved(await updateMyProfile({ nickname: nextNickname }));
    } catch {
      setHasError(true);
      setIsSaving(false);
    }
  };

  return (
    // 입력칸 위에 "닉네임"이 이미 적혀 있어 시트 제목은 두지 않는다
    <BottomSheet isOpen onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2">
          <span className="flex justify-between text-body-sm-mobile text-text-secondary">
            닉네임
            <span aria-hidden="true" className="tabular-nums">
              {value.length}/{NICKNAME_MAX_LENGTH}
            </span>
          </span>
          <span className="flex h-12 rounded-lg border border-border-subtle bg-bg-surface px-3 focus-within:border-action-primary">
            <HintInput
              autoComplete="off"
              hint="1~20자로 입력해 주세요"
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(event) => setValue(event.target.value)}
              spellCheck={false}
              value={value}
            />
          </span>
        </label>
        {hasError && (
          <p className="text-body-sm-mobile text-status-danger-fg" role="alert">
            닉네임을 바꾸지 못했어요
          </p>
        )}
        <ActionButton
          disabled={!canSave}
          loading={isSaving}
          size="large"
          type="submit"
        >
          저장
        </ActionButton>
      </form>
    </BottomSheet>
  );
};

export default NicknameSheet;
