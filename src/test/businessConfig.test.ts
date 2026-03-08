import { describe, it, expect } from 'vitest';
import {
  getFiscalYear,
  dateToFYStartYear,
  fyLabel,
  fyBounds,
  FY_START_MONTH,
} from '../lib/businessConfig';

describe('businessConfig', () => {
  describe('getFiscalYear', () => {
    it('returns Apr 2024 – Mar 2025 for a date in Jun 2024', () => {
      const { fyStart, fyEnd } = getFiscalYear(new Date(2024, 5, 15));
      expect(fyStart.getMonth()).toBe(3);
      expect(fyStart.getFullYear()).toBe(2024);
      expect(fyEnd.getMonth()).toBe(2);
      expect(fyEnd.getFullYear()).toBe(2025);
    });

    it('returns Apr 2023 – Mar 2024 for a date in Feb 2024', () => {
      const { fyStart, fyEnd } = getFiscalYear(new Date(2024, 1, 15));
      expect(fyStart.getFullYear()).toBe(2023);
      expect(fyStart.getMonth()).toBe(3);
      expect(fyEnd.getFullYear()).toBe(2024);
      expect(fyEnd.getMonth()).toBe(2);
    });

    it('returns correct FY for April 1st (boundary)', () => {
      const { fyStart } = getFiscalYear(new Date(2025, 3, 1));
      expect(fyStart.getFullYear()).toBe(2025);
      expect(fyStart.getMonth()).toBe(3);
    });

    it('returns previous FY for March 31st (boundary)', () => {
      const { fyStart } = getFiscalYear(new Date(2025, 2, 31));
      expect(fyStart.getFullYear()).toBe(2024);
    });
  });

  describe('dateToFYStartYear', () => {
    it('maps Jun 2024 → 2024', () => {
      expect(dateToFYStartYear(new Date(2024, 5, 15))).toBe(2024);
    });

    it('maps Feb 2025 → 2024', () => {
      expect(dateToFYStartYear(new Date(2025, 1, 15))).toBe(2024);
    });

    it('maps Apr 1 2025 → 2025', () => {
      expect(dateToFYStartYear(new Date(2025, 3, 1))).toBe(2025);
    });

    it('maps Mar 31 2025 → 2024', () => {
      expect(dateToFYStartYear(new Date(2025, 2, 31))).toBe(2024);
    });
  });

  describe('fyLabel', () => {
    it('produces FY-2025 for startYear 2024', () => {
      expect(fyLabel(2024)).toBe('FY-2025');
    });
  });

  describe('fyBounds', () => {
    it('returns Apr 1 start and Mar 31 end for startYear 2024', () => {
      const { start, end } = fyBounds(2024);
      expect(start.getMonth()).toBe(3);
      expect(start.getDate()).toBe(1);
      expect(start.getFullYear()).toBe(2024);
      expect(end.getMonth()).toBe(2);
      expect(end.getDate()).toBe(31);
      expect(end.getFullYear()).toBe(2025);
    });
  });
});
