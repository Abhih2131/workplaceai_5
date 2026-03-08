import { describe, it, expect } from 'vitest';
import { diffDays, mean, mode, round1, parseDate, parseNum, safeStr, safeLower, titleCase } from '../lib/formatters';

describe('formatters', () => {
  describe('diffDays', () => {
    it('returns positive for later − earlier', () => {
      expect(diffDays(new Date(2025, 0, 10), new Date(2025, 0, 1))).toBeCloseTo(9, 0);
    });

    it('returns 0 for same date', () => {
      const d = new Date(2025, 5, 1);
      expect(diffDays(d, d)).toBe(0);
    });
  });

  describe('mean', () => {
    it('returns 0 for empty array', () => {
      expect(mean([])).toBe(0);
    });

    it('computes correct mean', () => {
      expect(mean([10, 20, 30])).toBe(20);
    });
  });

  describe('mode', () => {
    it('returns N/A for empty array', () => {
      expect(mode([])).toBe('N/A');
    });

    it('returns most frequent value', () => {
      expect(mode(['a', 'b', 'a', 'c'])).toBe('a');
    });
  });

  describe('round1', () => {
    it('rounds to 1 decimal', () => {
      expect(round1(3.456)).toBe(3.5);
      expect(round1(3.44)).toBe(3.4);
    });
  });

  describe('parseDate', () => {
    it('returns null for falsy values', () => {
      expect(parseDate(null)).toBeNull();
      expect(parseDate('')).toBeNull();
      expect(parseDate(undefined)).toBeNull();
    });

    it('parses Date objects', () => {
      const d = new Date(2025, 5, 15);
      expect(parseDate(d)).toEqual(d);
    });

    it('rejects invalid Date objects', () => {
      expect(parseDate(new Date('invalid'))).toBeNull();
    });

    it('parses Excel serial numbers', () => {
      const d = parseDate(45292);
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2024);
    });

    it('parses ISO date strings', () => {
      const d = parseDate('2025-06-15');
      expect(d).not.toBeNull();
      expect(d!.getFullYear()).toBe(2025);
    });

    it('parses DD/MM/YYYY format', () => {
      const d = parseDate('15/06/2025');
      expect(d).not.toBeNull();
      expect(d!.getDate()).toBe(15);
      expect(d!.getMonth()).toBe(5); // June
    });
  });

  describe('parseNum', () => {
    it('returns null for empty/nullish', () => {
      expect(parseNum(null)).toBeNull();
      expect(parseNum('')).toBeNull();
    });

    it('parses numeric strings', () => {
      expect(parseNum('42.5')).toBe(42.5);
    });

    it('returns null for non-numeric strings', () => {
      expect(parseNum('abc')).toBeNull();
    });
  });

  describe('safeStr', () => {
    it('trims and returns strings', () => {
      expect(safeStr('  hello  ')).toBe('hello');
    });

    it('returns null for empty/nullish', () => {
      expect(safeStr(null)).toBeNull();
      expect(safeStr('')).toBeNull();
    });
  });

  describe('safeLower / titleCase', () => {
    it('lowercases safely', () => {
      expect(safeLower('HELLO')).toBe('hello');
      expect(safeLower(null)).toBe('');
    });

    it('title-cases', () => {
      expect(titleCase('hello')).toBe('Hello');
      expect(titleCase('WORLD')).toBe('World');
    });
  });
});
