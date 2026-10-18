import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { CircleAlert, MapPin, Search, X } from 'lucide-react';

import {
  deleteMyLocation,
  fetchMyLocation,
  hasLocation,
  type MemberLocation,
  saveMyLocation,
} from '@user/api/location';
import { fetchMyProfile } from '@user/api/member';
import ActionButton from '@user/ui/ActionButton/ActionButton';
import { cardClassName } from '@user/ui/Card/Card';
import FeedbackToast, {
  type FeedbackToastTone,
} from '@user/ui/FeedbackToast/FeedbackToast';
import FixedBottom from '@user/ui/FixedBottom/FixedBottom';
import HintInput from '@user/ui/HintInput/HintInput';
import TopBar from '@user/ui/TopBar/TopBar';

import AddressSearchResults from './AddressSearchResults';
import { getCurrentPosition, PositionError } from './currentPosition';
import { type AddressResult, findAddress } from './kakaoSearch';
import LocationNameSheet from './LocationNameSheet';
import { useAddressSearch } from './useAddressSearch';
import { getLocationLabel, rememberMyLocation } from './useMyLocation';

const TOAST_DURATION_MS = 2500;

interface LocationSettings {
  location: MemberLocation;
  // 위치 정보 이용에 동의했는지. 동의하지 않았으면 GPS를 쓰지 않는다
  locationOptIn: boolean;
}

// 저장하기 전에 고른 위치. GPS로 찾았거나 검색 결과에서 골랐다
interface PickedLocation {
  source: 'gps' | 'search';
  latitude: number;
  longitude: number;
  address: string | null;
  // 검색 결과의 장소 이름. 이름 칸에 미리 채운다
  placeName: string | null;
}

interface Toast {
  message: string;
  tone: FeedbackToastTone;
}

// 이름도 주소도 없는 위치는 주소를 못 찾았거나 주소 변환 전에 저장한 위치다
const getLocationName = (location: MemberLocation) =>
  getLocationLabel(location) ?? 'GPS로 찾은 위치';

const emptyLocation: MemberLocation = {
  locationNickname: null,
  roadAddress: null,
  latitude: null,
  longitude: null,
};

// GPS로 못 찾으면 같은 화면 위쪽의 주소 검색으로 안내한다
const getPositionErrorMessage = (error: unknown) =>
  error instanceof PositionError && error.reason === 'denied'
    ? '위치 권한이 꺼져 있어요 · 주소로 찾아 주세요'
    : '현재 위치를 찾지 못했어요 · 주소로 찾아 주세요';

// settings: 마이페이지와 홈 헤더에서 들어오는 위치 설정
// onboarding: 가입할 때 맞춤 정보 다음, 튜토리얼 앞에 두는 단계. 저장하거나 건너뛰면 튜토리얼로 간다
export type LocationSettingsMode = 'settings' | 'onboarding';

interface LocationSettingsScreenProps {
  mode?: LocationSettingsMode;
}

// 위치 설정. 피드와 탐색에서 주변 가게를 찾을 기준 위치를 하나 정한다
// GPS로 찾은 현재 위치나, 주소 검색으로 고른 위치를 저장한다
const LocationSettingsScreen = ({
  mode = 'settings',
}: LocationSettingsScreenProps) => {
  const navigate = useNavigate();
  const isOnboarding = mode === 'onboarding';
  // undefined면 불러오는 중, null이면 실패
  const [settings, setSettings] = useState<LocationSettings | null>();
  // 다시 시도할 때마다 올려서 요청을 새로 보낸다
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState<'locate' | 'save' | 'delete' | null>(
    null,
  );
  // 골랐지만 아직 저장하지 않은 위치. 있으면 이름을 붙이는 시트를 연다
  const [picked, setPicked] = useState<PickedLocation | null>(null);
  const addressSearch = useAddressSearch();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    let ignore = false;

    Promise.all([fetchMyProfile(), fetchMyLocation()])
      .then(([profile, location]) => {
        if (ignore) return;
        rememberMyLocation(location);
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

  // 온보딩에서는 위치를 저장하거나 건너뛰면 서비스 안내로 넘어간다. 뒤로 가기로 이 단계에 돌아오지 않게 바꿔 넣는다
  const goToTutorial = () =>
    navigate('/onboarding/tutorial', { replace: true });

  const handleLocate = async () => {
    if (pending || !settings?.locationOptIn) return;

    setPending('locate');
    try {
      setSaveError(null);
      const position = await getCurrentPosition();
      // 주소를 못 찾아도 좌표만으로 저장할 수 있게 한다
      const address = await findAddress(
        position.latitude,
        position.longitude,
      ).catch(() => null);
      setPicked({ ...position, address, placeName: null, source: 'gps' });
    } catch (error) {
      setToast({ message: getPositionErrorMessage(error), tone: 'error' });
    } finally {
      setPending(null);
    }
  };

  const handleSelectResult = (result: AddressResult) => {
    setSaveError(null);
    setPicked({ ...result, source: 'search' });
  };

  const handleSave = async (locationNickname: string | undefined) => {
    if (pending || !settings || !picked) return;

    setPending('save');
    try {
      const location = await saveMyLocation({
        latitude: picked.latitude,
        longitude: picked.longitude,
        roadAddress: picked.address ?? undefined,
        locationNickname,
      });
      rememberMyLocation(location);
      if (isOnboarding) {
        goToTutorial();
        return;
      }
      setSettings({ ...settings, location });
      setPicked(null);
      // 저장했으면 검색을 닫고 저장한 위치 카드를 보여준다
      addressSearch.changeQuery('');
      setToast({
        message:
          picked.source === 'gps'
            ? '현재 위치로 설정했어요'
            : '선택한 위치로 설정했어요',
        tone: 'success',
      });
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
      rememberMyLocation(emptyLocation);
      setSettings({ ...settings, location: emptyLocation });
      setToast({ message: '위치를 삭제했어요', tone: 'success' });
    } catch {
      setToast({ message: '위치를 삭제하지 못했어요', tone: 'error' });
    } finally {
      setPending(null);
    }
  };

  return (
    // 화면 높이에 맞춰 두고 검색 결과만 안에서 스크롤해, 페이지 전체가 길어지지 않게 한다
    // 틀(StackLayout)이 하단 버튼 자리로 비워 둔 아래 여백만큼 당겨 화면 높이를 딱 맞춘다
    <div className="-mb-[calc(76px+env(safe-area-inset-bottom))] flex h-dvh flex-col">
      {isOnboarding ? (
        // 서버에는 이미 온보딩을 저장해서 맞춤 정보로 돌아가지 않는다
        // 회사 주소를 바로 모를 수 있어 건너뛸 수 있게 하고, 나중에 홈 헤더의 위치에서 설정한다
        <TopBar
          action={
            <button
              className="flex h-11 items-center px-2.5 text-body-sm-mobile font-bold text-text-secondary focus-visible:outline-2 focus-visible:outline-action-primary"
              onClick={goToTutorial}
              type="button"
            >
              {settings && hasLocation(settings.location)
                ? '다음'
                : '나중에 하기'}
            </button>
          }
          title="위치 설정"
        />
      ) : (
        <TopBar onBack={() => navigate(-1)} title="위치 설정" />
      )}
      <div className="flex min-h-0 flex-1 flex-col gap-3 px-page pt-4">
        {isOnboarding && (
          <h2 className="text-h2-mobile leading-snug font-bold text-text-primary">
            어디서 점심을 드세요?
          </h2>
        )}
        <p className="text-body-sm-mobile text-text-secondary">
          설정한 위치 주변 가게의 쿠폰을 보여드려요
        </p>
        {/* 2글자 이상 입력하면 아래에 저장한 위치 대신 검색 결과를 보여준다. 위치 동의와 상관없이 쓸 수 있다 */}
        <div
          className="flex h-12 items-center gap-2 rounded-xl border border-border-subtle bg-bg-surface px-4 focus-within:border-action-primary"
          role="search"
        >
          <Search
            aria-hidden="true"
            className="size-4.5 shrink-0 text-text-secondary"
          />
          <HintInput
            aria-label="회사, 건물 이름이나 주소로 찾기"
            autoComplete="off"
            enterKeyHint="search"
            hint="회사, 건물 이름이나 주소로 찾기"
            onChange={(event) => addressSearch.changeQuery(event.target.value)}
            spellCheck={false}
            value={addressSearch.query}
          />
          {addressSearch.query && (
            <button
              aria-label="검색어 지우기"
              className="-mr-2 flex size-9 shrink-0 items-center justify-center text-text-tertiary"
              onClick={() => addressSearch.changeQuery('')}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>

        {addressSearch.isSearching && (
          <div className="-mx-page min-h-0 flex-1 overflow-y-auto overscroll-contain px-page pb-4">
            <AddressSearchResults
              onRetry={addressSearch.retry}
              onSelect={handleSelectResult}
              search={addressSearch.search}
            />
          </div>
        )}

        {/* 검색창과 같은 흰 상자가 이어지면 입력칸처럼 보여서, 제목을 붙여 다른 영역임을 보여준다 */}
        {!addressSearch.isSearching && (
          <section aria-labelledby="my-location-title" className="mt-3">
            <h2
              className="mb-2 text-body-sm-mobile font-bold text-text-primary"
              id="my-location-title"
            >
              내 위치
            </h2>

            {settings === undefined && (
              <div
                aria-hidden="true"
                className="h-13 animate-pulse rounded-xl bg-surface-subtle motion-reduce:animate-none"
              />
            )}

            {settings === null && (
              <div
                className={`flex min-h-13 items-center justify-between gap-3 px-4 py-2 ${cardClassName}`}
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

            {settings && hasLocation(settings.location) && (
              <div
                className={`flex min-h-13 items-center gap-3 px-4 py-2 ${cardClassName}`}
              >
                <div
                  aria-hidden="true"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-brand text-text-brand"
                >
                  <MapPin className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-sm-mobile font-medium text-text-primary">
                    {getLocationName(settings.location)}
                  </p>
                  {/* 이름을 붙였으면 주소를 아래에 함께 보여준다 */}
                  {settings.location.locationNickname &&
                    settings.location.roadAddress && (
                      <p className="mt-0.5 truncate text-caption-mobile text-text-secondary">
                        {settings.location.roadAddress}
                      </p>
                    )}
                </div>
                <button
                  aria-busy={pending === 'delete' || undefined}
                  className="h-9 shrink-0 rounded-lg px-2 text-body-sm-mobile font-bold text-text-secondary active:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-action-primary aria-busy:cursor-progress aria-busy:opacity-60"
                  onClick={handleDelete}
                  type="button"
                >
                  {pending === 'delete' ? '삭제하는 중' : '삭제'}
                </button>
              </div>
            )}

            {/* 저장한 위치가 없으면 흰 카드 대신 점선으로 비어 있는 자리처럼 보여준다 */}
            {settings && !hasLocation(settings.location) && (
              <p className="flex min-h-13 items-center justify-center rounded-xl border border-dashed border-border-subtle px-4 text-body-sm-mobile text-text-tertiary">
                아직 설정한 위치가 없어요
              </p>
            )}
          </section>
        )}

        {!addressSearch.isSearching && settings?.locationOptIn === false && (
          <p className="flex items-start gap-1.5 text-body-sm-mobile break-keep text-text-secondary">
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            위치 이용에 동의하지 않아 주소로만 설정할 수 있어요
          </p>
        )}
      </div>

      {/* 검색하는 동안에는 키보드 위로 올라와 결과를 가리지 않도록 숨긴다 */}
      {!addressSearch.isSearching && (
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
      )}

      {picked && (
        <LocationNameSheet
          address={picked.address}
          initialNickname={picked.placeName ?? undefined}
          latitude={picked.latitude}
          longitude={picked.longitude}
          title={picked.source === 'gps' ? '현재 위치' : '선택한 위치'}
          errorMessage={saveError}
          onClose={() => setPicked(null)}
          onSave={handleSave}
          saving={pending === 'save'}
        />
      )}
    </div>
  );
};

export default LocationSettingsScreen;
