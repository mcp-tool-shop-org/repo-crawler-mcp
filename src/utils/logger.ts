const PREFIX = '[repo-crawler-mcp]';

export const log = {
  info: (...args: unknown[]) => console.error(PREFIX, ...args),
  warn: (...args: unknown[]) => console.error(PREFIX, 'WARN:', ...args),
  error: (...args: unknown[]) => console.error(PREFIX, 'ERROR:', ...args),
};
