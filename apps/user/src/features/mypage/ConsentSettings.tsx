import { useState } from 'react';
import { Toggle } from '@repo/ui';

import { type MyProfile, updateMyProfile } from '@user/api/member';

type ConsentKey = keyof MyProfile['consents'];

const consentItems: {
  key: ConsentKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'notificationOptIn',
    label: '오픈 알림',
    description: '찜한 쿠폰이 열리기 전 10:50에 알려드려요',
  },
  {
    key: 'locationOptIn',
    label: '위치 정보 이용',
    description: '현재 위치로 주변 가게를 찾아요',
  },
];

interface ConsentSettingsProps {
  consents: MyProfile['consents'];
  // 서버에 저장된 값을 마이 탭이 가진 내 정보에도 반영한다
  onSaved: (profile: MyProfile) => void;
}

// 알림과 위치 정보 이용 동의. 누르면 바로 저장하고, 실패하면 원래대로 되돌린다
const ConsentSettings = ({ consents, onSaved }: ConsentSettingsProps) => {
  // 저장을 기다리는 동안에도 바뀐 쪽으로 먼저 보여준다
  const [values, setValues] = useState(consents);
  const [pendingKey, setPendingKey] = useState<ConsentKey | null>(null);
  const [hasError, setHasError] = useState(false);

  const handleToggle = async (key: ConsentKey) => {
    if (pendingKey) return;

    const previous = values;
    setValues({ ...values, [key]: !values[key] });
    setPendingKey(key);
    setHasError(false);
    try {
      const profile = await updateMyProfile({ [key]: !previous[key] });
      setValues(profile.consents);
      onSaved(profile);
    } catch {
      setValues(previous);
      setHasError(true);
    } finally {
      setPendingKey(null);
    }
  };

  return (
    <section aria-labelledby="consent-settings-title">
      <h2
        className="mb-2 px-1 text-body-sm-mobile font-bold text-text-primary"
        id="consent-settings-title"
      >
        알림·위치
      </h2>
      <ul className="divide-y divide-border-subtle overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
        {consentItems.map(({ description, key, label }) => {
          const inputId = `${key}-toggle`;
          const labelId = `${key}-label`;
          const descriptionId = `${key}-description`;

          return (
            <li className="flex items-center gap-3 px-4 py-3" key={key}>
              {/* 이름과 설명을 눌러도 스위치가 바뀐다 */}
              <label
                className="min-w-0 flex-1 cursor-pointer"
                htmlFor={inputId}
              >
                <span
                  className="block text-body-sm-mobile font-medium text-text-primary"
                  id={labelId}
                >
                  {label}
                </span>
                <span
                  className="mt-0.5 block text-caption-mobile text-text-secondary"
                  id={descriptionId}
                >
                  {description}
                </span>
              </label>
              {/* 공통 Toggle은 스위치만 쓰고, 이름은 왼쪽에 따로 둔다 */}
              <Toggle
                aria-busy={pendingKey === key || undefined}
                aria-describedby={descriptionId}
                aria-labelledby={labelId}
                checked={values[key]}
                // 공통 Toggle은 누를 수 있어도 기본 커서라 손가락 커서를 붙인다
                className="cursor-pointer"
                id={inputId}
                label=""
                onChange={() => handleToggle(key)}
              />
            </li>
          );
        })}
      </ul>
      {hasError && (
        <p
          className="mt-2 px-1 text-caption-mobile text-status-danger-fg"
          role="alert"
        >
          설정을 바꾸지 못했어요 · 다시 눌러 주세요
        </p>
      )}
    </section>
  );
};

export default ConsentSettings;
