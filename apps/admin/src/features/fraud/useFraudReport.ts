import { useEffect, useState } from 'react';

import { getMockFraudReport } from '@admin/api/mocks/fraud';

import type { FraudReport } from './fraudTypes';

type ReportState =
  | { status: 'loading' | 'error'; report?: never }
  | { status: 'success'; report: FraudReport };

export const useFraudReport = () => {
  const [state, setState] = useState<ReportState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // 화면을 나가거나 재시도한 뒤 이전 조회 결과가 새 상태를 덮지 않도록 막는다.
    let cancelled = false;
    getMockFraudReport().then(
      (report) => {
        if (!cancelled) setState({ status: 'success', report });
      },
      () => {
        if (!cancelled) setState({ status: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const retry = () => {
    // 재시도 중 이전 집계를 숨겨 실패한 결과를 최신 데이터처럼 보여주지 않는다.
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  };

  return { ...state, retry };
};
