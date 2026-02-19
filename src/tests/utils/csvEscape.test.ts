import { describe, it, expect } from 'vitest';
import { csvEscapeValue, csvRow } from '../../utils/csvEscape.js';

describe('csvEscapeValue', () => {
  it('passes plain strings through', () => {
    expect(csvEscapeValue('hello')).toBe('hello');
    expect(csvEscapeValue('123')).toBe('123');
  });

  it('quotes strings containing commas', () => {
    expect(csvEscapeValue('hello,world')).toBe('"hello,world"');
  });

  it('quotes strings containing newlines', () => {
    expect(csvEscapeValue('line1\nline2')).toBe('"line1\nline2"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(csvEscapeValue('say "hello"')).toBe('"say ""hello"""');
  });

  it('prevents formula injection with = prefix', () => {
    // After prefix, string is '=CMD("calc") which contains " so it gets CSV-quoted
    expect(csvEscapeValue('=CMD("calc")')).toBe("\"'=CMD(\"\"calc\"\")\"");
  });

  it('prevents formula injection with = prefix (no quotes)', () => {
    expect(csvEscapeValue('=1+2')).toBe("'=1+2");
  });

  it('prevents formula injection with + prefix', () => {
    expect(csvEscapeValue('+1+2')).toBe("'+1+2");
  });

  it('prevents formula injection with - prefix', () => {
    expect(csvEscapeValue('-1-2')).toBe("'-1-2");
  });

  it('prevents formula injection with @ prefix', () => {
    expect(csvEscapeValue('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
  });

  it('prevents formula injection with tab prefix', () => {
    expect(csvEscapeValue('\tcmd')).toBe("'\tcmd");
  });

  it('handles null and undefined', () => {
    expect(csvEscapeValue(null)).toBe('');
    expect(csvEscapeValue(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(csvEscapeValue(42)).toBe('42');
    expect(csvEscapeValue(0)).toBe('0');
  });
});

describe('csvRow', () => {
  it('joins values with commas', () => {
    expect(csvRow(['a', 'b', 'c'])).toBe('a,b,c');
  });

  it('escapes individual values', () => {
    expect(csvRow(['hello,world', 'normal', '=bad'])).toBe('"hello,world",normal,\'=bad');
  });
});
