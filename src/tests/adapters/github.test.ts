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
const { mockGetViews, mockGetClones, mockPaginateIterator, mockPaginate, mockRequest } = vi.hoisted(() => {
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
  const mockRequest = vi.fn().mockResolvedValue({ data: [] });
  return { mockGetViews, mockGetClones, mockPaginateIterator, mockPaginate, mockRequest };
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
    request: mockRequest,
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
    mockRequest.mockResolvedValue({ data: [] });
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

  describe('Tier 3', () => {
    it('fetches all Tier 3 sections with mock data', async () => {
      let requestCallCount = 0;
      mockRequest.mockImplementation((route: string) => {
        requestCallCount++;
        if (route.includes('dependabot/alerts')) {
          return Promise.resolve({
            data: [{
              number: 1,
              state: 'open',
              dependency: { package: { name: 'lodash', ecosystem: 'npm' } },
              security_vulnerability: { severity: 'high', vulnerable_version_range: '< 4.17.21', first_patched_version: { identifier: '4.17.21' } },
              security_advisory: { summary: 'Prototype Pollution in lodash', severity: 'high', identifiers: [{ type: 'CVE', value: 'CVE-2021-23337' }, { type: 'GHSA', value: 'GHSA-35jh-r3h4-6jhm' }] },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-06-01T00:00:00Z',
              fixed_at: null,
              dismissed_at: null,
              html_url: 'https://github.com/owner/test-repo/security/dependabot/1',
            }],
          });
        }
        if (route.includes('security-advisories')) {
          return Promise.resolve({
            data: [{
              ghsa_id: 'GHSA-xxxx-yyyy-zzzz',
              cve_id: 'CVE-2024-1234',
              summary: 'Test advisory',
              description: 'A test security advisory',
              severity: 'critical',
              state: 'published',
              published_at: '2024-03-01T00:00:00Z',
              updated_at: '2024-03-01T00:00:00Z',
              withdrawn_at: null,
              html_url: 'https://github.com/owner/test-repo/security/advisories/GHSA-xxxx-yyyy-zzzz',
              vulnerabilities: [{
                package: { ecosystem: 'npm', name: 'test-pkg' },
                severity: 'critical',
                vulnerable_version_range: '< 2.0.0',
                first_patched_version: { identifier: '2.0.0' },
              }],
            }],
          });
        }
        if (route.includes('dependency-graph/sbom')) {
          return Promise.resolve({
            data: {
              sbom: {
                spdxVersion: 'SPDX-2.3',
                name: 'owner/test-repo',
                creationInfo: { created: '2024-06-01T00:00:00Z' },
                packages: [{
                  name: 'npm:lodash',
                  versionInfo: '4.17.21',
                  licenseDeclared: 'MIT',
                  externalRefs: [{ referenceCategory: 'PACKAGE-MANAGER', referenceType: 'npm' }],
                  downloadLocation: 'https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz',
                }],
              },
            },
          });
        }
        if (route.includes('code-scanning/alerts')) {
          return Promise.resolve({
            data: [{
              number: 1,
              state: 'open',
              rule: { id: 'js/xss', description: 'Cross-site scripting', severity: 'error', security_severity_level: 'high' },
              tool: { name: 'CodeQL' },
              most_recent_instance: { ref: 'refs/heads/main', location: { path: 'src/app.js', start_line: 42 } },
              created_at: '2024-05-01T00:00:00Z',
              updated_at: '2024-05-01T00:00:00Z',
              fixed_at: null,
              dismissed_at: null,
              html_url: 'https://github.com/owner/test-repo/security/code-scanning/1',
            }],
          });
        }
        if (route.includes('secret-scanning/alerts')) {
          return Promise.resolve({
            data: [{
              number: 1,
              state: 'open',
              secret_type: 'github_personal_access_token',
              secret_type_display_name: 'GitHub Personal Access Token',
              resolution: null,
              resolved_at: null,
              created_at: '2024-04-01T00:00:00Z',
              updated_at: '2024-04-01T00:00:00Z',
              html_url: 'https://github.com/owner/test-repo/security/secret-scanning/1',
              push_protection_bypassed: false,
            }],
          });
        }
        return Promise.resolve({ data: [] });
      });

      const data = await adapter.fetchTier3('owner', 'test-repo');

      // Dependabot
      expect(data.dependabotAlerts).toHaveLength(1);
      expect(data.dependabotAlerts[0].package_name).toBe('lodash');
      expect(data.dependabotAlerts[0].severity).toBe('high');
      expect(data.dependabotAlerts[0].cve_id).toBe('CVE-2021-23337');
      expect(data.dependabotAlerts[0].patched_version).toBe('4.17.21');

      // Security Advisories
      expect(data.securityAdvisories).toHaveLength(1);
      expect(data.securityAdvisories[0].ghsa_id).toBe('GHSA-xxxx-yyyy-zzzz');
      expect(data.securityAdvisories[0].severity).toBe('critical');
      expect(data.securityAdvisories[0].vulnerabilities).toHaveLength(1);

      // SBOM
      expect(data.sbom).toBeDefined();
      expect(data.sbom!.packages).toHaveLength(1);
      expect(data.sbom!.packages[0].name).toBe('npm:lodash');
      expect(data.sbom!.packages[0].license).toBe('MIT');

      // Code Scanning
      expect(data.codeScanningAlerts).toHaveLength(1);
      expect(data.codeScanningAlerts[0].rule_id).toBe('js/xss');
      expect(data.codeScanningAlerts[0].tool_name).toBe('CodeQL');
      expect(data.codeScanningAlerts[0].most_recent_instance?.path).toBe('src/app.js');

      // Secret Scanning
      expect(data.secretScanningAlerts).toHaveLength(1);
      expect(data.secretScanningAlerts[0].secret_type).toBe('github_personal_access_token');

      // Permissions — all should be 'granted'
      expect(data.permissions.dependabotAlerts).toBe('granted');
      expect(data.permissions.securityAdvisories).toBe('granted');
      expect(data.permissions.sbom).toBe('granted');
      expect(data.permissions.codeScanningAlerts).toBe('granted');
      expect(data.permissions.secretScanningAlerts).toBe('granted');
    });

    it('respects Tier 3 section filtering', async () => {
      mockRequest.mockResolvedValue({
        data: {
          sbom: {
            spdxVersion: 'SPDX-2.3',
            name: 'test',
            creationInfo: { created: '2024-01-01T00:00:00Z' },
            packages: [],
          },
        },
      });

      const data = await adapter.fetchTier3('owner', 'test-repo', {
        sections: ['sbom'],
      });

      expect(data.sbom).toBeDefined();
      expect(data.dependabotAlerts).toEqual([]);
      expect(data.securityAdvisories).toEqual([]);
      expect(data.codeScanningAlerts).toEqual([]);
      expect(data.secretScanningAlerts).toEqual([]);
    });

    it('gracefully handles 403 with permission tracking', async () => {
      const err403 = Object.assign(new Error('Forbidden'), { status: 403 });
      mockRequest.mockRejectedValue(err403);

      const data = await adapter.fetchTier3('owner', 'test-repo');

      expect(data.dependabotAlerts).toEqual([]);
      expect(data.securityAdvisories).toEqual([]);
      expect(data.sbom).toBeNull();
      expect(data.codeScanningAlerts).toEqual([]);
      expect(data.secretScanningAlerts).toEqual([]);

      // All should be 'denied'
      expect(data.permissions.dependabotAlerts).toBe('denied');
      expect(data.permissions.securityAdvisories).toBe('denied');
      expect(data.permissions.sbom).toBe('denied');
      expect(data.permissions.codeScanningAlerts).toBe('denied');
      expect(data.permissions.secretScanningAlerts).toBe('denied');
    });

    it('handles 404 as not_enabled', async () => {
      const err404 = Object.assign(new Error('Not Found'), { status: 404 });
      mockRequest.mockRejectedValue(err404);

      const data = await adapter.fetchTier3('owner', 'test-repo', {
        sections: ['dependabotAlerts', 'codeScanningAlerts'],
      });

      expect(data.permissions.dependabotAlerts).toBe('not_enabled');
      expect(data.permissions.codeScanningAlerts).toBe('not_enabled');
    });
  });
});
