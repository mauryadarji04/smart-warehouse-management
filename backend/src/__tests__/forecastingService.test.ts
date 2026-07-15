import { calculateMovingAverage } from '../services/forecastingService';

describe('calculateMovingAverage', () => {
  it('returns 0 for empty array', () => {
    expect(calculateMovingAverage([])).toBe(0);
  });

  it('calculates average of last 7 days by default', () => {
    const data = [10, 20, 30, 40, 50, 60, 70];
    // avg of all 7 = 280/7 = 40
    expect(calculateMovingAverage(data)).toBe(40);
  });

  it('uses only the last N values when data exceeds period', () => {
    const data = [100, 200, 10, 20, 30, 40, 50, 60, 70];
    // last 7: [10, 20, 30, 40, 50, 60, 70] → avg = 40
    expect(calculateMovingAverage(data, 7)).toBe(40);
  });

  it('uses all values when data is shorter than period', () => {
    const data = [10, 20, 30];
    // avg of [10, 20, 30] = 20
    expect(calculateMovingAverage(data, 7)).toBe(20);
  });

  it('handles single value', () => {
    expect(calculateMovingAverage([42], 7)).toBe(42);
  });

  it('handles custom period', () => {
    const data = [5, 10, 15, 20, 25];
    // last 3: [15, 20, 25] → avg = 20
    expect(calculateMovingAverage(data, 3)).toBe(20);
  });

  it('handles all-zero data', () => {
    expect(calculateMovingAverage([0, 0, 0, 0, 0, 0, 0])).toBe(0);
  });
});
