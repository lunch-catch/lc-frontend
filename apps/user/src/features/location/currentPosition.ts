// GPS로 현재 위치를 찾지 못한 이유
// denied: 브라우저 위치 권한을 막음, unavailable: 위치를 찾지 못했거나 너무 오래 걸림
export type PositionErrorReason = 'denied' | 'unavailable';

export class PositionError extends Error {
  readonly reason: PositionErrorReason;

  constructor(reason: PositionErrorReason) {
    super(reason);
    this.name = 'PositionError';
    this.reason = reason;
  }
}

const POSITION_TIMEOUT_MS = 10_000;
// 1분 안에 찾은 위치는 다시 찾지 않고 쓴다
const POSITION_MAX_AGE_MS = 60_000;

// 브라우저에게 현재 위치를 한 번 묻는다. 처음 부르면 브라우저가 위치 권한을 묻는다
export const getCurrentPosition = () =>
  new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new PositionError('unavailable'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) =>
        resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) =>
        reject(
          new PositionError(
            error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable',
          ),
        ),
      { maximumAge: POSITION_MAX_AGE_MS, timeout: POSITION_TIMEOUT_MS },
    );
  });
