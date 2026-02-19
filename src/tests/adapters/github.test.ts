import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAdapter } from '../../adapters/github.js';

// Mock Octokit at module level
vi.mock('@octokit/rest', () => {
  const mockOctokit = {
    rest: {
      repos: {
        get: vi.fn().mockResolvedValue({
          data: {
            name: 'test-repo',
            full_name: 'owner/test-repo',
            description: 'A test repo',
            topics: ['test'],
            owner: { login: 'owner', type: 'User', avatar_url: 'https://example.com/avatar.png' },
            visibility: 'public',
            license: { spdx_id: 'MIT', name: 'MIT License' },
            default_branch: 'main',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-06-01T00:00:00Z',
            pushed_at: '2024-06-01T00:00:00Z',
            homepage: null,
            fork: false,
            stargazers_count: 100,
            forks_count: 10,
            open_issues_count: 5,
            watchers_count: 50,
            size: 1024,
            html_url: 'https://github.com/owner/test-repo',
            archived: false,
            disabled: false,
            has_issues: true,
            has_wiki: true,
            has_discussions: false,
          },
        }),
        listLanguages: vi.fn().mockResolvedValue({ data: { TypeScript: 5000, JavaScript: 2000 } }),
        getReadme: vi.fn().mockResolvedValue({
          data: {
            content: Buffer.from('# Test Repo').toString('base64'),
            encoding: 'base64',
            size: 11,
            path: 'README.md',
            html_url: 'https://github.com/owner/test-repo/blob/main/README.md',
          },
        }),
        getCommunityProfileMetrics: vi.fn().mockResolvedValue({
          data: {
            health_percentage: 70,
            description: 'A test repo',
            documentation: null,
            files: {
              code_of_conduct: null,
              contributing: { url: 'https://example.com/contributing' },
              license: { spdx_id: 'MIT', url: 'https://example.com/license' },
              readme: { url: 'https://example.com/readme' },
              issue_template: null,
              pull_request_template: null,
            },
          },
        }),
        listCommits: vi.fn(),
        listContributors: vi.fn(),
        listBranches: vi.fn(),
        listTags: vi.fn(),
        listReleases: vi.fn(),
      },
      git: {
        getTree: vi.fn().mockResolvedValue({
          data: {
            sha: 'abc123',
            truncated: false,
            tree: [
              { path: 'README.md', type: 'blob', sha: 'def456', size: 100 },
              { path: 'src', type: 'tree', sha: 'ghi789' },
              { path: 'src/index.ts', type: 'blob', sha: 'jkl012', size: 500 },
            ],
          },
        }),
      },
      rateLimit: {
        get: vi.fn().mockResolvedValue({
          data: {
            resources: {
              core: { limit: 5000, remaining: 4990, reset: 1700000000, used: 10 },
            },
          },
        }),
      },
      actions: {
        listRepoWorkflows: vi.fn().mockResolvedValue({
          data: { workflows: [] },
        }),
      },
    },
    paginate: Object.assign(
      vi.fn().mockResolvedValue([]),
      {
        iterator: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: () => ({
            next: () => Promise.resolve({ done: true, value: undefined }),
          }),
        }),
      },
    ),
  };

  return {
    Octokit: {
      plugin: () => vi.fn().mockReturnValue(mockOctokit),
    },
  };
});

vi.mock('@octokit/plugin-throttling', () => ({
  throttling: {},
}));

describe('GitHubAdapter', () => {
  let adapter: GitHubAdapter;

  beforeEach(() => {
    adapter = new GitHubAdapter();
  });

  it('fetches Tier 1 data with all sections', async () => {
    const data = await adapter.fetchTier1('owner', 'test-repo');

    expect(data.metadata).toBeDefined();
    expect(data.metadata?.name).toBe('test-repo');
    expect(data.metadata?.stargazers_count).toBe(100);
    expect(data.tree).toHaveLength(3);
    expect(data.languages).toEqual({ TypeScript: 5000, JavaScript: 2000 });
    expect(data.readme?.content).toBe('# Test Repo');
    expect(data.community?.health_percentage).toBe(70);
    expect(data.rateLimit.remaining).toBe(4990);
  });

  it('respects section filtering', async () => {
    const data = await adapter.fetchTier1('owner', 'test-repo', {
      sections: ['metadata', 'languages'],
    });

    expect(data.metadata).toBeDefined();
    expect(data.languages).toEqual({ TypeScript: 5000, JavaScript: 2000 });
    // Excluded sections return defaults
    expect(data.readme).toBeNull();
    expect(data.tree).toEqual([]);
    expect(data.community).toBeNull();
  });

  it('respects section exclusion', async () => {
    const data = await adapter.fetchTier1('owner', 'test-repo', {
      excludeSections: ['tree', 'readme'],
    });

    expect(data.metadata).toBeDefined();
    expect(data.tree).toEqual([]);
    expect(data.readme).toBeNull();
  });

  it('returns rate limit info', async () => {
    const rateLimit = await adapter.getRateLimit();
    expect(rateLimit.limit).toBe(5000);
    expect(rateLimit.remaining).toBe(4990);
    expect(rateLimit.used).toBe(10);
  });
});
