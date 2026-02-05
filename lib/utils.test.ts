import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatNumber, formatDate } from './utils';

describe('Utils', () => {
  describe('cn (class name merge)', () => {
    it('should merge class names', () => {
      const result = cn('foo', 'bar');
      expect(result).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'included', false && 'excluded');
      expect(result).toBe('base included');
    });

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4', 'p-6');
      expect(result).toBe('p-6');
    });

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'end');
      expect(result).toBe('base end');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers', () => {
      const result = formatCurrency(1234.56);
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toContain('0');
    });

    it('should format large numbers', () => {
      const result = formatCurrency(1000000);
      expect(result).toContain('1');
      expect(result).toContain('000');
    });

    it('should handle decimal places', () => {
      const result = formatCurrency(99.99);
      expect(result).toContain('99');
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with default decimals', () => {
      const result = formatNumber(1234.5678, 2);
      expect(result).toBe('1,234.57');
    });

    it('should format integers', () => {
      const result = formatNumber(1000, 0);
      expect(result).toBe('1,000');
    });

    it('should handle zero', () => {
      const result = formatNumber(0, 2);
      expect(result).toBe('0.00');
    });
  });

  describe('formatDate', () => {
    it('should format Date object', () => {
      const date = new Date('2024-01-15T12:00:00Z');
      const result = formatDate(date);
      expect(result).toContain('15');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('should format date string', () => {
      const result = formatDate('2024-06-20');
      expect(result).toContain('20');
      expect(result).toContain('Jun');
      expect(result).toContain('2024');
    });
  });
});
