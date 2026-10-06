import { useEffect, useState } from 'react';

import { getMockDashboard } from '@admin/api/mocks/dashboard';

import type { DashboardDataset } from './dashboardTypes';

type DashboardState =
  | { status: 'loading' | 'error'; data?: never }
  | { status: 'success'; data: DashboardDataset };

export const useDashboard = () => {
  const [state, setState] = useState<DashboardState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    getMockDashboard().then(
      (data) => {
        if (!cancelled) setState({ status: 'success', data });
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
    setState({ status: 'loading' });
    setAttempt((value) => value + 1);
  };
  return { ...state, retry };
};
