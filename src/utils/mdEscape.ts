export function mdEscapeCell(value: unknown): string {
  return String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\n/g, ' ')
    .replace(/\r/g, '');
}

export function mdTableRow(cells: unknown[]): string {
  return '| ' + cells.map(mdEscapeCell).join(' | ') + ' |';
}

export function mdTableSeparator(count: number): string {
  return '| ' + Array(count).fill('---').join(' | ') + ' |';
}
