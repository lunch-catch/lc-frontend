export const getChartAxisMaximum = (values: number[]) => {
  const maximum = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  // 눈금을 네 구간으로 나누되 1·2·2.5·5·10 배수로 올려 실제 최댓값이 축 밖으로 나가지 않게 한다.
  const step =
    [1, 2, 2.5, 5, 10].find((value) => value * magnitude >= maximum / 4) ?? 10;
  return step * magnitude * 4;
};

export const getChartLabelInterval = (count: number, width: number) =>
  // 날짜 라벨이 겹치지 않는 범위에서 약 80px 간격으로 표시한다.
  Math.max(1, Math.ceil(count / Math.max(2, Math.floor(width / 80))));

export const getNearestChartIndex = (
  position: number,
  plotLeft: number,
  plotWidth: number,
  count: number,
) => {
  if (count <= 1) return 0;
  const index = Math.round(((position - plotLeft) / plotWidth) * (count - 1));
  return Math.max(0, Math.min(count - 1, index));
};

/** 데이터·크기에만 의존하는 계산을 포인터 상태에서 분리한다. */
export const getDashboardChartGeometry = (
  count: number,
  width: number,
  height: number,
  variant: 'line' | 'bar',
  values: number[],
  comparison = false,
) => {
  const chartLayout = comparison
    ? { left: 64, right: 32, top: 20 }
    : { left: 40, right: 12, top: 12 };
  const bottom = height - 28;
  const labelY = height - 8;
  const tickInterval = getChartLabelInterval(count, width);
  const max = getChartAxisMaximum(values);
  const min =
    Math.min(0, ...values) < 0
      ? -getChartAxisMaximum(values.map((value) => -value))
      : 0;
  const plotWidth = width - chartLayout.left - chartLayout.right;
  const slotWidth = plotWidth / Math.max(1, count);
  const firstX = chartLayout.left + (variant === 'bar' ? slotWidth / 2 : 0);
  const pointWidth = plotWidth - (variant === 'bar' ? slotWidth : 0);
  const x = (index: number) =>
    count === 1
      ? chartLayout.left + plotWidth / 2
      : firstX + (index * pointWidth) / (count - 1);
  const y = (value: number) =>
    bottom - ((value - min) / (max - min)) * (bottom - chartLayout.top);
  const barWidth = Math.max(1, Math.min(32, (plotWidth / count) * 0.55));
  const paths = (data: (number | null)[]) => {
    const segments: { points: string; start: number; end: number }[] = [];
    data.forEach((value, index) => {
      if (value === null) return;
      const point = x(index) + ',' + y(value);
      const last = segments.at(-1);
      if (last && last.end === index - 1) {
        last.points += ' ' + point;
        last.end = index;
      } else segments.push({ points: point, start: index, end: index });
    });
    return segments;
  };
  const showLabel = (index: number) =>
    index === 0 ||
    index === count - 1 ||
    (index % tickInterval === 0 && index < count - 1 - tickInterval / 2);
  const getLabelAnchor = (index: number) =>
    variant === 'bar' || count === 1
      ? 'middle'
      : index === 0
        ? 'start'
        : index === count - 1
          ? 'end'
          : 'middle';
  return {
    chartLayout,
    bottom,
    labelY,
    max,
    min,
    plotWidth,
    firstX,
    pointWidth,
    x,
    y,
    barWidth,
    paths,
    showLabel,
    getLabelAnchor,
  };
};
