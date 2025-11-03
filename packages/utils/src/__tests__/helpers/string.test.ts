import { describe, expect, it } from '@jest/globals';
import { capitalize, isEmpty, truncate } from '../../helpers/string';

describe('String Helpers', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });

    it('should handle single character strings', () => {
      expect(capitalize('a')).toBe('A');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle strings with multiple words', () => {
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('should handle strings starting with numbers', () => {
      expect(capitalize('123abc')).toBe('123abc');
    });

    it('should handle strings starting with special characters', () => {
      expect(capitalize('$hello')).toBe('$hello');
    });
  });

  describe('truncate', () => {
    it('should truncate strings longer than maxLength', () => {
      expect(truncate('hello world', 5)).toBe('hello…');
    });

    it('should not truncate strings shorter than maxLength', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('should not truncate strings equal to maxLength', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });

    it('should handle empty strings', () => {
      expect(truncate('', 5)).toBe('');
    });

    it('should handle maxLength of 0', () => {
      expect(truncate('hello', 0)).toBe('…');
    });

    it('should handle maxLength of 1', () => {
      expect(truncate('hello', 1)).toBe('h…');
    });

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(1000);
      const result = truncate(longString, 10);
      expect(result).toBe('aaaaaaaaaa…');
      expect(result.length).toBe(11); // 10 + ellipsis
    });

    it('should handle unicode characters', () => {
      expect(truncate('Hello 世界', 7)).toBe('Hello 世…');
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(isEmpty('')).toBe(true);
    });

    it('should return true for whitespace-only strings', () => {
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty('\t')).toBe(true);
      expect(isEmpty('\n')).toBe(true);
      expect(isEmpty('  \t\n  ')).toBe(true);
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false);
      expect(isEmpty('a')).toBe(false);
    });

    it('should handle strings with only spaces', () => {
      expect(isEmpty(' ')).toBe(true);
      expect(isEmpty('  ')).toBe(true);
    });

    it('should handle strings with mixed whitespace', () => {
      expect(isEmpty(' \t\n ')).toBe(true);
    });
  });
});
