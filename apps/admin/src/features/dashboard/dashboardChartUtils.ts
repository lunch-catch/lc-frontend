export const getChartAxisMaximum = (values: number[]) => {
  const maximum = Math.max(1, ...values);
  const magnitude = 10 ** Math.floor(Math.log10(maximum / 4));
  // 눈금을 네 구간으로 나누되 1·2·2.5·5·10 배수로 올려 실제 최댓값이 축 밖으로 나가지 않게 한다.
  const step =
    [1, 2, 2.5, 5, 10].find((value) => value * magnitude >= maximum / 4) ?? 10;
  return step * magnitude * 4;
};

export const getChartLabelInterval = (count: number, width: number) =>
  Math.max(1, Math.ceil(count / Math.max(2, Math.floor(width / 120))));

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

export const getSparklinePoints = (values: number[]) => {
  const maximum = Math.max(1, ...values);
  const minimum = Math.min(0, ...values);
  // 카드 안의 작은 추이선도 0을 기준으로 그려 변동 폭이 과장되지 않게 한다.
  return values
    .map((value, index) => {
      const x = (index * 100) / Math.max(1, values.length - 1);
      const y = 32 - ((value - minimum) / (maximum - minimum)) * 28;
      return `${x},${y}`;
    })
    .join(' ');
};
