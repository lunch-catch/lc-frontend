import { type FormEvent, useState } from 'react';
import { BottomSheet } from '@repo/ui';
import { MapPin } from 'lucide-react';

import ActionButton from '@user/components/ActionButton/ActionButton';
import HintInput from '@user/components/HintInput/HintInput';
import LocationPreviewMap from '@user/features/map/LocationPreviewMap';

// 서버가 받는 위치 이름의 최대 길이
const NICKNAME_MAX_LENGTH = 50;

export interface LocationNameSheetProps {
  title: string;
  // 고른 위치. 지도에 핀으로 보여준다
  latitude: number;
  longitude: number;
  // 고른 위치의 주소. 찾지 못했으면 null
  address: string | null;
  // 처음 채워 둘 이름 (예: 검색한 장소 이름)
  initialNickname?: string;
  saving: boolean;
  // 저장하지 못했을 때 시트 안에 보여줄 안내
  errorMessage: string | null;
  onClose: () => void;
  // 이름을 비워 두면 undefined로 넘긴다
  onSave: (nickname: string | undefined) => void;
}

// 고른 위치를 지도와 주소로 보여주고, 이름을 붙여 저장하는 시트
// 저장하기 전에 지도와 주소로 맞는 위치인지 확인하게 한다. 이름은 붙이지 않아도 된다
// 닫힐 때 화면에서 빠져 입력한 이름도 함께 지워진다
const LocationNameSheet = ({
  address,
  errorMessage,
  initialNickname = '',
  latitude,
  longitude,
  onClose,
  onSave,
  saving,
  title,
}: LocationNameSheetProps) => {
  const [nickname, setNickname] = useState(initialNickname);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    onSave(nickname.trim() || undefined);
  };

  return (
    <BottomSheet isOpen onClose={onClose} title={title}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <LocationPreviewMap latitude={latitude} longitude={longitude} />
        <p className="flex items-start gap-2 rounded-lg bg-surface-subtle px-3 py-3 text-body-sm-mobile font-medium text-text-primary">
          <MapPin
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-text-brand"
          />
          {address ?? '주소를 찾지 못했어요'}
        </p>
        <label className="flex flex-col gap-2">
          <span className="text-body-sm-mobile text-text-secondary">
            이름 (선택)
          </span>
          <span className="flex h-12 rounded-lg border border-border-subtle bg-bg-surface px-3 focus-within:border-action-primary">
            <HintInput
              autoComplete="off"
              hint="예: 회사"
              maxLength={NICKNAME_MAX_LENGTH}
              onChange={(event) => setNickname(event.target.value)}
              value={nickname}
            />
          </span>
        </label>
        {errorMessage && (
          <p className="text-body-sm-mobile text-status-danger-fg" role="alert">
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
