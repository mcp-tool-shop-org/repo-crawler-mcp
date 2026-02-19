import { describe, it, expect } from 'vitest';
import { validateOwnerRepo, validateOrg, parseGitHubUrl } from '../../utils/validation.js';

describe('validateOwnerRepo', () => {
  it('accepts valid owner/repo pairs', () => {
    expect(() => validateOwnerRepo('octocat', 'hello-world')).not.toThrow();
    expect(() => validateOwnerRepo('mcp-tool-shop-org', 'repo-crawler-mcp')).not.toThrow();
    expect(() => validateOwnerRepo('a', 'b')).not.toThrow();
  });

  it('rejects empty owner', () => {
    expect(() => validateOwnerRepo('', 'repo')).toThrow('Invalid GitHub owner');
  });

  it('rejects owner with leading hyphen', () => {
    expect(() => validateOwnerRepo('-bad', 'repo')).toThrow('Invalid GitHub owner');
  });

  it('rejects owner with trailing hyphen', () => {
    expect(() => validateOwnerRepo('bad-', 'repo')).toThrow('Invalid GitHub owner');
  });

  it('rejects owner longer than 39 chars', () => {
    expect(() => validateOwnerRepo('a'.repeat(40), 'repo')).toThrow('Invalid GitHub owner');
  });

  it('rejects empty repo', () => {
    expect(() => validateOwnerRepo('owner', '')).toThrow('Invalid GitHub repo');
  });

  it('rejects repo with path traversal', () => {
    expect(() => validateOwnerRepo('owner', '../etc/passwd')).toThrow('Invalid GitHub repo');
  });

  it('rejects repo with double dots', () => {
    expect(() => validateOwnerRepo('owner', 'a..b')).toThrow('Invalid GitHub repo');
  });

  it('accepts repo with single dot', () => {
    expect(() => validateOwnerRepo('owner', 'my.repo')).not.toThrow();
  });

  it('accepts repo with underscores and hyphens', () => {
    expect(() => validateOwnerRepo('owner', 'my_repo-name')).not.toThrow();
  });
});

describe('validateOrg', () => {
  it('accepts valid org names', () => {
    expect(() => validateOrg('mcp-tool-shop-org')).not.toThrow();
    expect(() => validateOrg('github')).not.toThrow();
  });

  it('rejects invalid org names', () => {
    expect(() => validateOrg('')).toThrow('Invalid GitHub org');
    expect(() => validateOrg('-bad')).toThrow('Invalid GitHub org');
  });
});

describe('parseGitHubUrl', () => {
  it('parses standard GitHub URLs', () => {
    expect(parseGitHubUrl('https://github.com/octocat/hello-world')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    });
  });

  it('strips .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/octocat/hello-world.git')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    });
  });

  it('handles www prefix', () => {
    expect(parseGitHubUrl('https://www.github.com/octocat/hello-world')).toEqual({
      owner: 'octocat',
      repo: 'hello-world',
    });
  });

  it('handles URLs with trailing path segments', () => {
    const result = parseGitHubUrl('https://github.com/octocat/hello-world/tree/main');
    expect(result.owner).toBe('octocat');
    expect(result.repo).toBe('hello-world');
  });

  it('rejects non-GitHub URLs', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/user/repo')).toThrow('Not a GitHub URL');
  });

  it('rejects invalid URLs', () => {
    expect(() => parseGitHubUrl('not-a-url')).toThrow('Invalid URL');
  });

  it('rejects GitHub URLs without owner/repo', () => {
    expect(() => parseGitHubUrl('https://github.com/')).toThrow('does not contain owner/repo');
    expect(() => parseGitHubUrl('https://github.com/onlyone')).toThrow('does not contain owner/repo');
  });
});
