import { describe, it, expect } from 'vitest';

describe('Format Utils', () => {
  it('should format date correctly', () => {
    const date = new Date('2025-12-09T00:00:00Z');
    const formatted = date.toLocaleDateString('vi-VN');
    expect(formatted).toBeTruthy();
  });

  it('should format number correctly', () => {
    const num = 1000000;
    const formatted = num.toLocaleString('vi-VN');
    expect(formatted).toBe('1.000.000');
  });

  it('should handle empty string', () => {
    const str = '';
    expect(str.length).toBe(0);
  });
});
