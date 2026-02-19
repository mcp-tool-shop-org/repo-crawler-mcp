import { CrawlerError } from './errors.js';
import { ErrorCode } from '../types.js';

// GitHub username: 1-39 chars, alphanumeric + hyphens, no leading/trailing hyphens, no consecutive hyphens
const OWNER_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

// GitHub repo name: 1-100 chars, alphanumeric + hyphens + underscores + dots, no .. sequences
const REPO_REGEX = /^[a-zA-Z0-9._-]{1,100}$/;

export function validateOwnerRepo(owner: string, repo: string): void {
  if (!OWNER_REGEX.test(owner)) {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `Invalid GitHub owner: "${owner}"`);
  }
  if (!REPO_REGEX.test(repo) || repo.includes('..')) {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `Invalid GitHub repo name: "${repo}"`);
  }
}

export function validateOrg(org: string): void {
  if (!OWNER_REGEX.test(org)) {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `Invalid GitHub org: "${org}"`);
  }
}

export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `Invalid URL: "${url}"`);
  }

  if (parsed.hostname !== 'github.com' && parsed.hostname !== 'www.github.com') {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `Not a GitHub URL: "${url}"`);
  }

  const parts = parsed.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new CrawlerError(ErrorCode.INVALID_INPUT, `URL does not contain owner/repo: "${url}"`);
  }

  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, ''),
  };
}
