const DANGEROUS_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

export function csvEscapeValue(value: unknown): string {
  let str = String(value ?? '');

  // Formula injection prevention: prefix dangerous characters with single quote
  if (DANGEROUS_PREFIXES.some(p => str.startsWith(p))) {
    str = "'" + str;
  }

  // Standard CSV: quote if contains comma, newline, or double-quote
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  }

  return str;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvEscapeValue).join(',');
}
