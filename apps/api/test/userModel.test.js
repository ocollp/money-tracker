import { describe, expect, it } from 'vitest';
import {
  defaultSettings,
  sanitizePatch,
  PATCHABLE_KEYS,
} from '../src/lib/userModel.js';

describe('userModel', () => {
  describe('defaultSettings', () => {
    it('returns every patchable key set to null', () => {
      const s = defaultSettings();
      for (const key of PATCHABLE_KEYS) {
        expect(s).toHaveProperty(key);
        expect(s[key]).toBeNull();
      }
    });
  });

  describe('sanitizePatch', () => {
    it('returns empty object for null, undefined, or non-object body', () => {
      expect(sanitizePatch(null)).toEqual({});
      expect(sanitizePatch(undefined)).toEqual({});
      expect(sanitizePatch('x')).toEqual({});
    });

    it('strips unknown keys and keeps only PATCHABLE_KEYS', () => {
      expect(
        sanitizePatch({
          spreadsheetId: 'abc',
          evil: 'nope',
          profilePrimaryLabel: '  Main  ',
        })
      ).toEqual({
        spreadsheetId: 'abc',
        profilePrimaryLabel: 'Main',
      });
    });

    it('maps empty string to null for string fields', () => {
      expect(sanitizePatch({ spreadsheetId: '' })).toEqual({
        spreadsheetId: null,
      });
    });

    it('coerces numeric fields from strings or numbers', () => {
      expect(
        sanitizePatch({
          mortgageEndYear: '2030',
          mortgageEndMonth: 6,
          mortgageMonthlyPayment: '1200.5',
          ownershipShare: '0.25',
          assumedUnemployment: 0,
        })
      ).toEqual({
        mortgageEndYear: 2030,
        mortgageEndMonth: 6,
        mortgageMonthlyPayment: 1200.5,
        ownershipShare: 0.25,
        assumedUnemployment: 0,
      });
    });

    it('omits numeric fields that parse to NaN', () => {
      expect(sanitizePatch({ mortgageEndYear: 'x' })).toEqual({});
    });

    it('allows explicit null for cleared fields', () => {
      expect(sanitizePatch({ spreadsheetId: null })).toEqual({
        spreadsheetId: null,
      });
    });

    it('ignores keys explicitly set to undefined', () => {
      expect(sanitizePatch({ spreadsheetId: undefined })).toEqual({});
    });
  });
});
