import { calculateEOQ, calculateReorderPoint } from '../services/reorderService';

describe('calculateEOQ', () => {
  it('returns correct EOQ for standard inputs', () => {
    // EOQ = ceil(sqrt((2 * 1000 * 50) / 2)) = ceil(sqrt(50000)) = ceil(223.6) = 224
    expect(calculateEOQ(1000, 50, 2)).toBe(224);
  });

  it('returns 0 when annual demand is 0', () => {
    expect(calculateEOQ(0, 50, 2)).toBe(0);
  });

  it('returns 0 when ordering cost is 0', () => {
    expect(calculateEOQ(1000, 0, 2)).toBe(0);
  });

  it('returns 0 when holding cost is 0', () => {
    expect(calculateEOQ(1000, 50, 0)).toBe(0);
  });

  it('returns 0 for negative inputs', () => {
    expect(calculateEOQ(-100, 50, 2)).toBe(0);
    expect(calculateEOQ(100, -50, 2)).toBe(0);
    expect(calculateEOQ(100, 50, -2)).toBe(0);
  });

  it('rounds up to whole units', () => {
    // EOQ = sqrt((2 * 100 * 10) / 3) = sqrt(666.67) = 25.82 → ceil = 26
    expect(calculateEOQ(100, 10, 3)).toBe(26);
  });

  it('handles high demand correctly', () => {
    // EOQ = ceil(sqrt((2 * 100000 * 100) / 5)) = ceil(sqrt(4000000)) = 2000
    expect(calculateEOQ(100000, 100, 5)).toBe(2000);
  });
});

describe('calculateReorderPoint', () => {
  it('calculates reorder point correctly', () => {
    // 10 units/day * 7 days lead time = 70
    expect(calculateReorderPoint(10, 7)).toBe(70);
  });

  it('rounds up fractional results', () => {
    // 3.5 * 4 = 14 → ceil(14) = 14
    expect(calculateReorderPoint(3.5, 4)).toBe(14);
    // 1.2 * 3 = 3.6 → ceil(3.6) = 4
    expect(calculateReorderPoint(1.2, 3)).toBe(4);
  });

  it('returns 0 for zero demand', () => {
    expect(calculateReorderPoint(0, 7)).toBe(0);
  });

  it('returns 0 for zero lead time', () => {
    expect(calculateReorderPoint(10, 0)).toBe(0);
  });
});
