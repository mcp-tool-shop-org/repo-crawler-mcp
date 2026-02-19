import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GitHubAdapter } from '../../adapters/github.js';

function emptyAsyncIterator() {
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => Promise.resolve({ done: true as const, value: undefined }),
    }),
  };
}

function asyncIteratorFrom<T>(data: T[]) {
  let called = false;
  return {
    [Symbol.asyncIterator]: () => ({
      next: () => {
        if (!called) {
          called = true;
          return Promise.resolve({ done: false as const, value: { data } });
        }
        return Promise.resolve({ done: true as const, value: undefined });
      },
    }),
  };
}

// Use vi.hoisted so these are available inside the hoisted vi.mock factory
const { mockGetViews, mockGetClones, mockPaginateIterator, mockPaginate } = vi.hoisted(() => {
  const mockGetViews = vi.fn().mockResolvedValue({
    data: { count: 100, uniques: 50, views: [{ timestamp: '2024-06-01T00:00:00Z', count: 10, uniques: 5 }] },
  });
  const mockGetClones = vi.fn().mockResolvedValue({
    data: { count: 30, uniques: 15, clones: [{ timestamp: '2024-06-01T00:00:00Z', count: 3, uniques: 2 }] },
  });
  const mockPaginateIterator = vi.fn();
  const mockPaginate = Object.assign(
    vi.fn().mockResolvedValue([]),
    { iterator: mockPaginateIterator },
  );
  return { mockGetViews, mockGetClones, mockPaginateIterator, mockPaginate };
});

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
        getViews: mockGetViews,
        getClones: mockGetClones,
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
      issues: {
        listForRepo: vi.fn(),
        listMilestones: vi.fn(),
      },
      pulls: {
        list: vi.fn(),
      },
    },
    paginate: mockPaginate,
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
    // Reset paginate mocks to empty defaults
    mockPaginateIterator.mockReturnValue(emptyAsyncIterator());
    mockPaginate.mockResolvedValue([]);
    mockGetViews.mockResolvedValue({
      data: { count: 100, uniques: 50, views: [{ timestamp: '2024-06-01T00:00:00Z', count: 10, uniques: 5 }] },
    });
    mockGetClones.mockResolvedValue({
      data: { count: 30, uniques: 15, clones: [{ timestamp: '2024-06-01T00:00:00Z', count: 3, uniques: 2 }] },
    });
  });

  describe('Tier 1', () => {
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

  describe('Tier 2', () => {
    it('fetches all Tier 2 sections', async () => {
      let iteratorCallCount = 0;
      mockPaginateIterator.mockImplementation(() => {
        iteratorCallCount++;
        if (iteratorCallCount === 1) {
          // Issues call
          return asyncIteratorFrom([
            {
              number: 1,
              title: 'Bug report',
              state: 'open',
              labels: [{ name: 'bug' }],
              assignees: [{ login: 'dev1' }],
              created_at: '2024-06-01T00:00:00Z',
              updated_at: '2024-06-02T00:00:00Z',
              closed_at: null,
              user: { login: 'reporter' },
              comments: 3,
              reactions: { total_count: 5 },
              body: 'Something is broken',
              html_url: 'https://github.com/owner/test-repo/issues/1',
              pull_request: undefined,
            },
            {
              // PR in the issues endpoint — should be filtered out
              number: 2,
              title: 'Fix bug',
              state: 'open',
              labels: [],
              assignees: [],
              created_at: '2024-06-01T00:00:00Z',
              updated_at: '2024-06-02T00:00:00Z',
              closed_at: null,
              user: { login: 'dev1' },
              comments: 0,
              reactions: { total_count: 0 },
              body: '',
              html_url: 'https://github.com/owner/test-repo/pull/2',
              pull_request: { url: 'https://api.github.com/repos/owner/test-repo/pulls/2' },
            },
          ]);
        }
        if (iteratorCallCount === 2) {
          // PRs call
          return asyncIteratorFrom([
            {
              number: 2,
              title: 'Fix bug',
              state: 'open',
              labels: [{ name: 'fix' }],
              assignees: [{ login: 'dev1' }],
              created_at: '2024-06-01T00:00:00Z',
              updated_at: '2024-06-02T00:00:00Z',
              closed_at: null,
              merged_at: null,
              user: { login: 'dev1' },
              draft: false,
              body: 'Fixes the bug',
              html_url: 'https://github.com/owner/test-repo/pull/2',
              head: { ref: 'fix-bug' },
              base: { ref: 'main' },
            },
          ]);
        }
        return emptyAsyncIterator();
      });

      // Mock paginate (non-iterator) for milestones
      mockPaginate.mockResolvedValue([
        {
          number: 1,
          title: 'v1.0',
          state: 'open',
          description: 'First release',
          open_issues: 3,
          closed_issues: 7,
          due_on: '2024-12-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-06-01T00:00:00Z',
          html_url: 'https://github.com/owner/test-repo/milestone/1',
        },
      ]);

      const data = await adapter.fetchTier2('owner', 'test-repo');

      // Traffic
      expect(data.traffic).toBeDefined();
      expect(data.traffic?.views?.count).toBe(100);
      expect(data.traffic?.views?.uniques).toBe(50);
      expect(data.traffic?.clones?.count).toBe(30);

      // Issues — PR entry should be filtered out
      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].number).toBe(1);
      expect(data.issues[0].title).toBe('Bug report');
      expect(data.issues[0].labels).toEqual(['bug']);
      expect(data.issues[0].reactions_total).toBe(5);

      // Pull Requests
      expect(data.pullRequests).toHaveLength(1);
      expect(data.pullRequests[0].number).toBe(2);
      expect(data.pullRequests[0].head_ref).toBe('fix-bug');
      expect(data.pullRequests[0].base_ref).toBe('main');

      // Milestones
      expect(data.milestones).toHaveLength(1);
      expect(data.milestones[0].title).toBe('v1.0');
      expect(data.milestones[0].open_issues).toBe(3);

      // Discussions (stub — returns empty)
      expect(data.discussions).toEqual([]);
    });

    it('respects Tier 2 section filtering', async () => {
      const data = await adapter.fetchTier2('owner', 'test-repo', {
        sections: ['traffic'],
      });

      expect(data.traffic).toBeDefined();
      expect(data.issues).toEqual([]);
      expect(data.pullRequests).toEqual([]);
      expect(data.milestones).toEqual([]);
      expect(data.discussions).toEqual([]);
    });

    it('gracefully handles traffic 403', async () => {
      mockGetViews.mockRejectedValueOnce(new Error('403'));
      mockGetClones.mockRejectedValueOnce(new Error('403'));

      const data = await adapter.fetchTier2('owner', 'test-repo', {
        sections: ['traffic'],
      });

      // Promise.allSettled catches individual failures — traffic object still returned with null fields
      expect(data.traffic).toEqual({ views: null, clones: null });
    });

    it('caps issue body to 500 chars', async () => {
      const longBody = 'x'.repeat(1000);
      mockPaginateIterator.mockReturnValueOnce(
        asyncIteratorFrom([
          {
            number: 1,
            title: 'Long issue',
            state: 'open',
            labels: [],
            assignees: [],
            created_at: '2024-06-01T00:00:00Z',
            updated_at: '2024-06-02T00:00:00Z',
            closed_at: null,
            user: { login: 'user1' },
            comments: 0,
            reactions: { total_count: 0 },
            body: longBody,
            html_url: 'https://github.com/owner/test-repo/issues/1',
            pull_request: undefined,
          },
        ]),
      );

      const data = await adapter.fetchTier2('owner', 'test-repo', {
        sections: ['issues'],
      });

      expect(data.issues).toHaveLength(1);
      expect(data.issues[0].body_preview.length).toBe(500);
    });
  });
});
