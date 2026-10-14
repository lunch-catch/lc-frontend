import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleAlert, MapPin } from 'lucide-react';

import {
  deleteMyLocation,
  fetchMyLocation,
  hasLocation,
  type MemberLocation,
  saveMyLocation,
} from '@user/api/location';
import { fetchMyProfile } from '@user/api/member';
import ActionButton from '@user/components/ActionButton/ActionButton';
import FeedbackToast, {
  type FeedbackToastTone,
} from '@user/components/FeedbackToast/FeedbackToast';
import FixedBottom from '@user/components/FixedBottom/FixedBottom';
import TopBar from '@user/components/TopBar/TopBar';

import { getCurrentPosition, PositionError } from './currentPosition';
import LocationNameSheet from './LocationNameSheet';

const TOAST_DURATION_MS = 2500;

interface LocationSettings {
  location: MemberLocation;
  // 위치 정보 이용에 동의했는지. 동의하지 않았으면 GPS를 쓰지 않는다
  locationOptIn: boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface Toast {
  message: string;
  tone: FeedbackToastTone;
}

const cardClassName = 'rounded-xl border border-border-subtle bg-bg-surface';

// 주소를 찾는 카카오 지도가 붙기 전에는 GPS로 저장한 위치에 이름과 주소가 없다
const getLocationName = (location: MemberLocation) =>
  location.locationNickname ?? location.roadAddress ?? 'GPS로 찾은 위치';

const getPositionErrorMessage = (error: unknown) =>
  error instanceof PositionError && error.reason === 'denied'
    ? '브라우저 설정에서 위치 권한을 허용해 주세요'
    : '현재 위치를 찾지 못했어요';

// 위치 설정. 피드와 탐색에서 주변 가게를 찾을 기준 위치를 하나 정한다
// 지금은 GPS로 찾은 현재 위치만 저장할 수 있고, 주소 검색은 카카오 지도를 붙인 뒤에 더한다
const LocationSettingsScreen = () => {
  const navigate = useNavigate();
  // undefined면 불러오는 중, null이면 실패
  const [settings, setSettings] = useState<LocationSettings | null>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<'locate' | 'save' | 'delete' | null>(
    null,
  );
  // GPS로 찾았지만 아직 저장하지 않은 위치. 있으면 이름을 붙이는 시트를 연다
  const [found, setFound] = useState<Coordinates | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([fetchMyProfile(), fetchMyLocation()])
      .then(([profile, location]) => {
        if (ignore) return;
        setSettings({
          location,
          locationOptIn: profile.consents.locationOptIn,
        });
      })
      .catch(() => {
        if (!ignore) setSettings(null);
      });

    // 응답 전에 화면을 벗어나면 결과를 버린다
    return () => {
      ignore = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const retry = () => {
    setSettings(undefined);
    setAttempt((current) => current + 1);
  };

  const handleLocate = async () => {
    if (pending || !settings?.locationOptIn) return;

    setPending('locate');
    try {
      setSaveError(null);
      setFound(await getCurrentPosition());
    } catch (error) {
      setToast({ message: getPositionErrorMessage(error), tone: 'error' });
    } finally {
      setPending(null);
    }
  };

  const handleSave = async (locationNickname: string | undefined) => {
    if (pending || !settings || !found) return;

    setPending('save');
    try {
      const location = await saveMyLocation({ ...found, locationNickname });
      setSettings({ ...settings, location });
      setFound(null);
      setToast({ message: '현재 위치로 설정했어요', tone: 'success' });
    } catch {
      setSaveError('위치를 저장하지 못했어요');
    } finally {
      setPending(null);
    }
  };

  const handleDelete = async () => {
    if (pending || !settings) return;

    setPending('delete');
    try {
      await deleteMyLocation();
      setSettings({
        ...settings,
        location: {
          locationNickname: null,
          roadAddress: null,
          latitude: null,
          longitude: null,
        },
      });
      setToast({ message: '위치를 삭제했어요', tone: 'success' });
    } catch {
      setToast({ message: '위치를 삭제하지 못했어요', tone: 'error' });
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="flex flex-col">
      <TopBar onBack={() => navigate(-1)} title="위치 설정" />
      <div className="flex flex-col gap-3 px-page pt-4">
        <p className="text-body-sm-mobile text-text-secondary">
          설정한 위치 주변 가게의 쿠폰을 보여드려요
        </p>

        {settings === undefined && (
          <div
            aria-hidden="true"
            className="h-18 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
          />
        )}

        {settings === null && (
          <div
            className={`flex items-center justify-between gap-3 px-4 py-4 ${cardClassName}`}
          >
            <p className="text-body-sm-mobile text-text-secondary">
              위치 정보를 불러오지 못했어요
            </p>
            <button
              className="h-9 shrink-0 rounded-lg border border-border-subtle px-3 text-body-sm-mobile font-bold text-text-primary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={retry}
              type="button"
            >
              다시 시도
            </button>
          </div>
        )}

        {settings && (
          <section
            aria-label="설정한 위치"
            className={`flex items-center gap-3 px-4 py-4 ${cardClassName}`}
          >
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-brand text-text-brand"
            >
              <MapPin className="size-5" />
            </div>
            {hasLocation(settings.location) ? (
              <>
                <p className="min-w-0 flex-1 truncate text-body-sm-mobile font-medium text-text-primary">
                  {getLocationName(settings.location)}
                </p>
                <button
                  aria-busy={pending === 'delete' || undefined}
                  className="h-9 shrink-0 rounded-lg px-2 text-body-sm-mobile font-bold text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary aria-busy:cursor-progress aria-busy:opacity-60"
                  onClick={handleDelete}
                  type="button"
                >
                  {pending === 'delete' ? '삭제하는 중' : '삭제'}
                </button>
              </>
            ) : (
              <p className="min-w-0 flex-1 text-body-sm-mobile text-text-secondary">
                아직 설정한 위치가 없어요
              </p>
            )}
          </section>
        )}

        {settings?.locationOptIn === false && (
          <p className="flex items-start gap-1.5 text-caption-mobile text-text-secondary">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-3.5 shrink-0"
            />
            위치 정보 이용에 동의하지 않아 현재 위치를 찾을 수 없어요
          </p>
        )}
      </div>

      <FixedBottom>
        {/* 결과는 누른 버튼 바로 위에 띄운다. 위쪽에 띄우면 설명과 위치 카드를 가린다 */}
        {toast && (
          <div className="absolute inset-x-0 bottom-full px-page pb-2">
            <FeedbackToast message={toast.message} tone={toast.tone} />
          </div>
        )}
        <ActionButton
          disabled={!settings?.locationOptIn}
          loading={pending === 'locate'}
          onClick={handleLocate}
          size="large"
        >
          현재 위치로 설정
        </ActionButton>
      </FixedBottom>

      {found && (
        <LocationNameSheet
          errorMessage={saveError}
          onClose={() => setFound(null)}
          onSave={handleSave}
          saving={pending === 'save'}
        />
      )}
    </div>
  );
};

export default LocationSettingsScreen;
