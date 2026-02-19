import { Octokit } from '@octokit/rest';
import { throttling } from '@octokit/plugin-throttling';
import { log } from '../utils/logger.js';
import { TIER1_SECTIONS } from '../types.js';
import type {
  Tier1Data,
  RepoMetadata,
  FileTreeEntry,
  ReadmeContent,
  CommitSummary,
  ContributorInfo,
  BranchInfo,
  TagInfo,
  ReleaseInfo,
  CommunityProfile,
  WorkflowInfo,
  RateLimitInfo,
  Tier1Section,
} from '../types.js';
import type { PlatformAdapter, FetchOptions, OrgListOptions } from './types.js';

const ThrottledOctokit = Octokit.plugin(throttling);

function createOctokit(): InstanceType<typeof ThrottledOctokit> {
  const token = process.env.GITHUB_TOKEN;
  return new ThrottledOctokit({
    auth: token || undefined,
    throttle: {
      onRateLimit: (retryAfter: number, options: Record<string, unknown>, _octokit: unknown, retryCount: number) => {
        log.warn(`Rate limit hit for ${options.method} ${options.url}. Retry after ${retryAfter}s`);
        return retryCount < 2;
      },
      onSecondaryRateLimit: (retryAfter: number, options: Record<string, unknown>) => {
        log.warn(`Secondary rate limit for ${options.method} ${options.url}. Wait ${retryAfter}s`);
        return false;
      },
    },
  });
}

function resolveSections(options?: FetchOptions): Set<Tier1Section> {
  let sections: Set<Tier1Section>;
  if (options?.sections && options.sections.length > 0) {
    sections = new Set(options.sections.filter(s => (TIER1_SECTIONS as readonly string[]).includes(s)) as Tier1Section[]);
  } else {
    sections = new Set([...TIER1_SECTIONS]);
  }
  if (options?.excludeSections) {
    for (const s of options.excludeSections) {
      sections.delete(s as Tier1Section);
    }
  }
  return sections;
}

function settled<T>(result: PromiseSettledResult<T | null>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

export class GitHubAdapter implements PlatformAdapter {
  readonly platform = 'github';
  private octokit: InstanceType<typeof ThrottledOctokit>;

  constructor() {
    this.octokit = createOctokit();
    const hasToken = !!process.env.GITHUB_TOKEN;
    log.info(`GitHub adapter initialized (auth: ${hasToken ? 'token' : 'none'})`);
  }

  async fetchTier1(owner: string, repo: string, options?: FetchOptions): Promise<Tier1Data> {
    const sections = resolveSections(options);

    // Parallel fetch for independent single-call endpoints
    const [metadataR, treeR, languagesR, readmeR, communityR] = await Promise.allSettled([
      sections.has('metadata') ? this.fetchMetadata(owner, repo) : null,
      sections.has('tree') ? this.fetchTree(owner, repo) : null,
      sections.has('languages') ? this.fetchLanguages(owner, repo) : null,
      sections.has('readme') ? this.fetchReadme(owner, repo) : null,
      sections.has('community') ? this.fetchCommunity(owner, repo) : null,
    ]);

    // Sequential paginated fetches
    const commits = sections.has('commits')
      ? await this.fetchCommits(owner, repo, options?.commitLimit ?? 30)
      : [];
    const contributors = sections.has('contributors')
      ? await this.fetchContributors(owner, repo, options?.contributorLimit ?? 30)
      : [];
    const branches = sections.has('branches')
      ? await this.fetchBranches(owner, repo)
      : [];
    const tags = sections.has('tags')
      ? await this.fetchTags(owner, repo)
      : [];
    const releases = sections.has('releases')
      ? await this.fetchReleases(owner, repo)
      : [];
    const workflows = sections.has('workflows')
      ? await this.fetchWorkflows(owner, repo)
      : [];

    const rateLimit = await this.getRateLimit();

    return {
      metadata: settled(metadataR),
      tree: settled(treeR) ?? [],
      languages: settled(languagesR) ?? {},
      readme: settled(readmeR),
      commits,
      contributors,
      branches,
      tags,
      releases,
      community: settled(communityR),
      workflows,
      rateLimit,
    };
  }

  async listOrgRepos(org: string, options?: OrgListOptions): Promise<RepoMetadata[]> {
    const limit = options?.limit ?? 30;
    const repos: RepoMetadata[] = [];

    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listForOrg,
      { org, per_page: 100, sort: 'updated', direction: 'desc', type: 'sources' },
    )) {
      for (const r of response.data) {
        // Apply filters
        if (!options?.includeForks && r.fork) continue;
        if (!options?.includeArchived && r.archived) continue;
        if (options?.minStars && (r.stargazers_count ?? 0) < options.minStars) continue;
        if (options?.language && r.language?.toLowerCase() !== options.language.toLowerCase()) continue;

        repos.push(this.mapRepoMetadata(r));
        if (repos.length >= limit) break;
      }
      if (repos.length >= limit) break;
    }

    return repos;
  }

  async getRateLimit(): Promise<RateLimitInfo> {
    try {
      const { data } = await this.octokit.rest.rateLimit.get();
      const core = data.resources.core;
      return {
        limit: core.limit,
        remaining: core.remaining,
        reset: new Date(core.reset * 1000).toISOString(),
        used: core.used,
      };
    } catch {
      return { limit: 0, remaining: 0, reset: '', used: 0 };
    }
  }

  // ─── Private Fetch Methods ──────────────────────────────────────────────────

  private async fetchMetadata(owner: string, repo: string): Promise<RepoMetadata> {
    const { data } = await this.octokit.rest.repos.get({ owner, repo });
    return this.mapRepoMetadata(data);
  }

  private async fetchTree(owner: string, repo: string): Promise<FileTreeEntry[]> {
    // Need the default branch SHA first — get from repo metadata
    const { data: repoData } = await this.octokit.rest.repos.get({ owner, repo });
    const { data } = await this.octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: repoData.default_branch,
      recursive: 'true',
    });

    if (data.truncated) {
      log.warn(`Tree for ${owner}/${repo} was truncated (>100k entries)`);
    }

    return data.tree
      .filter((e): e is typeof e & { path: string; type: string; sha: string } =>
        !!e.path && !!e.type && !!e.sha)
      .map(e => ({
        path: e.path,
        type: e.type as 'blob' | 'tree',
        size: e.size,
        sha: e.sha,
      }));
  }

  private async fetchLanguages(owner: string, repo: string): Promise<Record<string, number>> {
    const { data } = await this.octokit.rest.repos.listLanguages({ owner, repo });
    return data;
  }

  private async fetchReadme(owner: string, repo: string): Promise<ReadmeContent | null> {
    try {
      const { data } = await this.octokit.rest.repos.getReadme({ owner, repo });
      return {
        content: data.content ? Buffer.from(data.content, 'base64').toString('utf-8') : '',
        encoding: data.encoding,
        size: data.size,
        path: data.path,
        html_url: data.html_url ?? '',
      };
    } catch {
      return null;
    }
  }

  private async fetchCommunity(owner: string, repo: string): Promise<CommunityProfile | null> {
    try {
      const { data } = await this.octokit.rest.repos.getCommunityProfileMetrics({ owner, repo });
      return {
        health_percentage: data.health_percentage,
        description: data.description,
        documentation: data.documentation,
        files: {
          code_of_conduct: data.files.code_of_conduct
            ? { name: data.files.code_of_conduct.name, url: data.files.code_of_conduct.url }
            : null,
          contributing: data.files.contributing
            ? { url: data.files.contributing.url }
            : null,
          license: data.files.license
            ? { spdx_id: (data.files.license as { spdx_id?: string }).spdx_id ?? 'UNKNOWN', url: data.files.license.url ?? '' }
            : null,
          readme: data.files.readme
            ? { url: data.files.readme.url }
            : null,
          issue_template: data.files.issue_template
            ? { url: (data.files.issue_template as { url?: string }).url ?? '' }
            : null,
          pull_request_template: data.files.pull_request_template
            ? { url: data.files.pull_request_template.url }
            : null,
        },
      };
    } catch {
      return null;
    }
  }

  private async fetchCommits(owner: string, repo: string, limit: number): Promise<CommitSummary[]> {
    const results: CommitSummary[] = [];
    for await (const response of this.octokit.paginate.iterator(
      this.octokit.rest.repos.listCommits,
      { owner, repo, per_page: Math.min(limit, 100) },
    )) {
      for (const c of response.data) {
        results.push({
          sha: c.sha,
          message: c.commit.message,
          author: {
            name: c.commit.author?.name ?? 'unknown',
            email: c.commit.author?.email ?? '',
            date: c.commit.author?.date ?? '',
          },
          committer: {
            name: c.commit.committer?.name ?? 'unknown',
            date: c.commit.committer?.date ?? '',
          },
          html_url: c.html_url,
        });
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
    return results;
  }

  private async fetchContributors(owner: string, repo: string, limit: number): Promise<ContributorInfo[]> {
    const results: ContributorInfo[] = [];
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.repos.listContributors,
        { owner, repo, per_page: Math.min(limit, 100) },
      )) {
        for (const c of response.data) {
          if (!c.login) continue;
          results.push({
            login: c.login,
            avatar_url: c.avatar_url ?? '',
            contributions: c.contributions,
            html_url: c.html_url ?? '',
            type: c.type ?? 'User',
          });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
    } catch {
      // Empty repos return 404 for contributors
    }
    return results;
  }

  private async fetchBranches(owner: string, repo: string): Promise<BranchInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listBranches,
        { owner, repo, per_page: 100 },
      );
      return data.map(b => ({ name: b.name, protected: b.protected }));
    } catch {
      return [];
    }
  }

  private async fetchTags(owner: string, repo: string): Promise<TagInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listTags,
        { owner, repo, per_page: 100 },
      );
      return data.map(t => ({ name: t.name, sha: t.commit.sha }));
    } catch {
      return [];
    }
  }

  private async fetchReleases(owner: string, repo: string): Promise<ReleaseInfo[]> {
    try {
      const data = await this.octokit.paginate(
        this.octokit.rest.repos.listReleases,
        { owner, repo, per_page: 100 },
      );
      return data.map(r => ({
        tag_name: r.tag_name,
        name: r.name,
        draft: r.draft,
        prerelease: r.prerelease,
        created_at: r.created_at,
        published_at: r.published_at,
        html_url: r.html_url,
        body: r.body ? r.body.slice(0, 500) : null,
        author: { login: r.author?.login ?? 'unknown' },
      }));
    } catch {
      return [];
    }
  }

  private async fetchWorkflows(owner: string, repo: string): Promise<WorkflowInfo[]> {
    try {
      const { data } = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: 100,
      });
      return data.workflows.map(w => ({
        id: w.id,
        name: w.name,
        path: w.path,
        state: w.state,
        created_at: w.created_at,
        updated_at: w.updated_at,
        html_url: w.html_url,
      }));
    } catch {
      return [];
    }
  }

  // ─── Mapping Helpers ────────────────────────────────────────────────────────

  private mapRepoMetadata(data: Record<string, unknown>): RepoMetadata {
    const d = data as Record<string, unknown>;
    const owner = d.owner as Record<string, unknown> | undefined;
    const license = d.license as Record<string, unknown> | null;
    const parent = d.parent as Record<string, unknown> | undefined;

    return {
      name: String(d.name ?? ''),
      full_name: String(d.full_name ?? ''),
      description: d.description != null ? String(d.description) : null,
      topics: Array.isArray(d.topics) ? d.topics.map(String) : [],
      owner: {
        login: String(owner?.login ?? ''),
        type: String(owner?.type ?? ''),
        avatar_url: String(owner?.avatar_url ?? ''),
      },
      visibility: String(d.visibility ?? 'public'),
      license: license ? { spdx_id: String(license.spdx_id ?? ''), name: String(license.name ?? '') } : null,
      default_branch: String(d.default_branch ?? 'main'),
      created_at: String(d.created_at ?? ''),
      updated_at: String(d.updated_at ?? ''),
      pushed_at: String(d.pushed_at ?? ''),
      homepage: d.homepage != null ? String(d.homepage) : null,
      fork: Boolean(d.fork),
      ...(parent ? { parent: { full_name: String(parent.full_name ?? ''), html_url: String(parent.html_url ?? '') } } : {}),
      stargazers_count: Number(d.stargazers_count ?? 0),
      forks_count: Number(d.forks_count ?? 0),
      open_issues_count: Number(d.open_issues_count ?? 0),
      watchers_count: Number(d.watchers_count ?? 0),
      size: Number(d.size ?? 0),
      html_url: String(d.html_url ?? ''),
      archived: Boolean(d.archived),
      disabled: Boolean(d.disabled),
      has_issues: Boolean(d.has_issues),
      has_wiki: Boolean(d.has_wiki),
      has_discussions: Boolean(d.has_discussions),
    };
  }
}
