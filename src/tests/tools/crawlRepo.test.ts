import { describe, it, expect } from 'vitest';
import { CrawlRepoInputSchema } from '../../types.js';

describe('CrawlRepoInputSchema', () => {
  it('validates minimal input', () => {
    const result = CrawlRepoInputSchema.parse({ owner: 'octocat', repo: 'hello-world' });
    expect(result.owner).toBe('octocat');
    expect(result.repo).toBe('hello-world');
    expect(result.tier).toBe('1');
    expect(result.commit_limit).toBe(30);
    expect(result.contributor_limit).toBe(30);
  });

  it('validates full input', () => {
    const result = CrawlRepoInputSchema.parse({
      owner: 'org',
      repo: 'repo',
      tier: '2',
      sections: ['metadata', 'tree'],
      exclude_sections: ['workflows'],
      commit_limit: 100,
      contributor_limit: 50,
    });
    expect(result.tier).toBe('2');
    expect(result.sections).toEqual(['metadata', 'tree']);
    expect(result.commit_limit).toBe(100);
  });

  it('rejects empty owner', () => {
    expect(() => CrawlRepoInputSchema.parse({ owner: '', repo: 'repo' })).toThrow();
  });

  it('rejects empty repo', () => {
    expect(() => CrawlRepoInputSchema.parse({ owner: 'owner', repo: '' })).toThrow();
  });

  it('rejects invalid tier', () => {
    expect(() => CrawlRepoInputSchema.parse({ owner: 'o', repo: 'r', tier: '4' })).toThrow();
  });

  it('clamps commit_limit', () => {
    expect(() => CrawlRepoInputSchema.parse({ owner: 'o', repo: 'r', commit_limit: 0 })).toThrow();
    expect(() => CrawlRepoInputSchema.parse({ owner: 'o', repo: 'r', commit_limit: 501 })).toThrow();
  });
});
