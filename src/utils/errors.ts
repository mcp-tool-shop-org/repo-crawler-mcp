import { ErrorCode, type ErrorCodeType } from '../types.js';

export class CrawlerError extends Error {
  constructor(
    public readonly code: ErrorCodeType,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CrawlerError';
  }
}

export function errorResponse(code: string, message: string, details?: Record<string, unknown>) {
  return {
    isError: true as const,
    content: [{ type: 'text' as const, text: JSON.stringify({ code, message, details }) }],
  };
}

export function successResponse(data: unknown) {
  return {
    content: [{
      type: 'text' as const,
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
    }],
  };
}

export function handleToolError(error: unknown) {
  if (error instanceof CrawlerError) {
    return errorResponse(error.code, error.message, error.details);
  }

  const err = error as Record<string, unknown>;

  // Octokit errors have a status property
  if (typeof err.status === 'number') {
    switch (err.status) {
      case 404:
        return errorResponse(ErrorCode.REPO_NOT_FOUND, String(err.message ?? 'Not found'));
      case 403:
        return errorResponse(ErrorCode.PERMISSION_DENIED, String(err.message ?? 'Forbidden'));
      case 401:
        return errorResponse(ErrorCode.AUTH_REQUIRED, String(err.message ?? 'Authentication required'));
      case 429:
        return errorResponse(ErrorCode.RATE_LIMITED, String(err.message ?? 'Rate limited'));
      default:
        return errorResponse(ErrorCode.API_ERROR, String(err.message ?? `HTTP ${err.status}`));
    }
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return errorResponse(ErrorCode.UNKNOWN_ERROR, message);
}
