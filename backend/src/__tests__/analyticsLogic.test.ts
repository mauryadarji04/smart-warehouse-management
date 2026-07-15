// Test the ABC classification and MAE/MAPE logic as pure functions
// (extracted from analyticsService for testability)

function classifyABC(products: { totalRevenue: number }[]) {
  const sorted = [...products].sort((a, b) => b.totalRevenue - a.totalRevenue);
  const totalRevenue = sorted.reduce((s, p) => s + p.totalRevenue, 0);
  if (totalRevenue === 0) return { A: [], B: [], C: [] };

  let cumulative = 0;
  const A: typeof sorted = [], B: typeof sorted = [], C: typeof sorted = [];

  for (const p of sorted) {
    cumulative += p.totalRevenue;
    const pct = (cumulative / totalRevenue) * 100;
    if (pct <= 80) A.push(p);
    else if (pct <= 95) B.push(p);
    else C.push(p);
  }
  return { A, B, C };
}

function calculateMAE(forecasts: { predicted: number; actual: number }[]): number {
  if (forecasts.length === 0) return 0;
  return forecasts.reduce((s, f) => s + Math.abs(f.predicted - f.actual), 0) / forecasts.length;
}

function calculateMAPE(forecasts: { predicted: number; actual: number }[]): number {
  const valid = forecasts.filter((f) => f.actual !== 0);
  if (valid.length === 0) return 0;
  return valid.reduce((s, f) => s + Math.abs((f.predicted - f.actual) / f.actual) * 100, 0) / valid.length;
}

describe('ABC Analysis classification', () => {
  it('classifies products into A, B, C by cumulative revenue', () => {
    const products = [
      { totalRevenue: 800 },
      { totalRevenue: 100 },
      { totalRevenue: 60 },
      { totalRevenue: 40 },
    ];
    // total = 1000; cumulative: 800(80%)→A, 900(90%)→B, 960(96%)→C, 1000→C
    const { A, B, C } = classifyABC(products);
    expect(A).toHaveLength(1);
    expect(A[0].totalRevenue).toBe(800);
    expect(B).toHaveLength(1);
    expect(C).toHaveLength(2);
  });

  it('returns empty classes for empty input', () => {
    const { A, B, C } = classifyABC([]);
    expect(A).toHaveLength(0);
    expect(B).toHaveLength(0);
    expect(C).toHaveLength(0);
  });

  it('puts a single high-revenue product in C (100% cumulative exceeds 80% threshold)', () => {
    // With one product, cumulative = 100% which is > 80 and > 95, so it lands in C
    const products = [{ totalRevenue: 1000 }];
    const { A, B, C } = classifyABC(products);
    expect(A).toHaveLength(0);
    expect(B).toHaveLength(0);
    expect(C).toHaveLength(1);
  });
});

describe('MAE calculation', () => {
  it('calculates mean absolute error correctly', () => {
    const forecasts = [
      { predicted: 10, actual: 8 },   // |10-8| = 2
      { predicted: 5, actual: 7 },    // |5-7|  = 2
      { predicted: 12, actual: 10 },  // |12-10|= 2
    ];
    expect(calculateMAE(forecasts)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(calculateMAE([])).toBe(0);
  });

  it('returns 0 for perfect forecasts', () => {
    expect(calculateMAE([{ predicted: 10, actual: 10 }, { predicted: 5, actual: 5 }])).toBe(0);
  });
});

describe('MAPE calculation', () => {
  it('calculates mean absolute percentage error correctly', () => {
    const forecasts = [
      { predicted: 11, actual: 10 }, // |1/10| * 100 = 10%
      { predicted: 9, actual: 10 },  // |1/10| * 100 = 10%
    ];
    expect(calculateMAPE(forecasts)).toBe(10);
  });

  it('ignores entries where actual is 0 (avoids division by zero)', () => {
    const forecasts = [
      { predicted: 10, actual: 0 },
      { predicted: 11, actual: 10 }, // 10%
    ];
    expect(calculateMAPE(forecasts)).toBe(10);
  });

  it('returns 0 for empty array', () => {
    expect(calculateMAPE([])).toBe(0);
  });
});
