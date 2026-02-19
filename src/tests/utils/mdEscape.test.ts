import { describe, it, expect } from 'vitest';
import { mdEscapeCell, mdTableRow, mdTableSeparator } from '../../utils/mdEscape.js';

describe('mdEscapeCell', () => {
  it('passes plain text through', () => {
    expect(mdEscapeCell('hello')).toBe('hello');
  });

  it('escapes pipe characters', () => {
    expect(mdEscapeCell('a|b|c')).toBe('a\\|b\\|c');
  });

  it('replaces newlines with spaces', () => {
    expect(mdEscapeCell('line1\nline2')).toBe('line1 line2');
  });

  it('removes carriage returns', () => {
    expect(mdEscapeCell('line1\r\nline2')).toBe('line1 line2');
  });

  it('handles null and undefined', () => {
    expect(mdEscapeCell(null)).toBe('');
    expect(mdEscapeCell(undefined)).toBe('');
  });

  it('converts numbers', () => {
    expect(mdEscapeCell(42)).toBe('42');
  });
});

describe('mdTableRow', () => {
  it('formats cells as a markdown table row', () => {
    expect(mdTableRow(['a', 'b', 'c'])).toBe('| a | b | c |');
  });

  it('escapes pipes in cell values', () => {
    expect(mdTableRow(['a|b', 'c'])).toBe('| a\\|b | c |');
  });
});

describe('mdTableSeparator', () => {
  it('creates separator for given column count', () => {
    expect(mdTableSeparator(3)).toBe('| --- | --- | --- |');
  });
});
