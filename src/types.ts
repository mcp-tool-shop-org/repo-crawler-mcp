import { z } from 'zod';

// ─── Error Codes ───────────────────────────────────────────────────────────────

export const ErrorCode = {
  INVALID_INPUT: 'INVALID_INPUT',
  REPO_NOT_FOUND: 'REPO_NOT_FOUND',
  ORG_NOT_FOUND: 'ORG_NOT_FOUND',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  API_ERROR: 'API_ERROR',
  TIER_UNAVAILABLE: 'TIER_UNAVAILABLE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode];

// ─── Tier 1 Data Interfaces ───────────────────────────────────────────────────

export interface RepoMetadata {
  name: string;
  full_name: string;
  description: string | null;
  topics: string[];
  owner: { login: string; type: string; avatar_url: string };
  visibility: string;
  license: { spdx_id: string; name: string } | null;
  default_branch: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  fork: boolean;
  parent?: { full_name: string; html_url: string };
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  watchers_count: number;
  size: number;
  html_url: string;
  archived: boolean;
  disabled: boolean;
  has_issues: boolean;
  has_wiki: boolean;
  has_discussions: boolean;
}

export interface FileTreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

export interface ReadmeContent {
  content: string;
  encoding: string;
  size: number;
  path: string;
  html_url: string;
}

export interface CommitSummary {
  sha: string;
  message: string;
  author: { name: string; email: string; date: string };
  committer: { name: string; date: string };
  html_url: string;
}

export interface ContributorInfo {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
  type: string;
}

export interface BranchInfo {
  name: string;
  protected: boolean;
}

export interface TagInfo {
  name: string;
  sha: string;
}

export interface ReleaseInfo {
  tag_name: string;
  name: string | null;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string | null;
  html_url: string;
  body: string | null;
  author: { login: string };
}

export interface CommunityProfile {
  health_percentage: number;
  description: string | null;
  documentation: string | null;
  files: {
    code_of_conduct: { name: string; url: string } | null;
    contributing: { url: string } | null;
    license: { spdx_id: string; url: string } | null;
    readme: { url: string } | null;
    issue_template: { url: string } | null;
    pull_request_template: { url: string } | null;
  };
}

export interface WorkflowInfo {
  id: number;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
  used: number;
}

export interface Tier1Data {
  metadata: RepoMetadata | null;
  tree: FileTreeEntry[];
  languages: Record<string, number>;
  readme: ReadmeContent | null;
  commits: CommitSummary[];
  contributors: ContributorInfo[];
  branches: BranchInfo[];
  tags: TagInfo[];
  releases: ReleaseInfo[];
  community: CommunityProfile | null;
  workflows: WorkflowInfo[];
  rateLimit: RateLimitInfo;
}

export const TIER1_SECTIONS = [
  'metadata',
  'tree',
  'languages',
  'readme',
  'commits',
  'contributors',
  'branches',
  'tags',
  'releases',
  'community',
  'workflows',
] as const;

export type Tier1Section = (typeof TIER1_SECTIONS)[number];

// ─── Crawl Result Wrapper ─────────────────────────────────────────────────────

export interface CrawlResult {
  owner: string;
  repo: string;
  crawledAt: string;
  tier: string;
  sections: string[];
  data: Tier1Data;
}

// ─── Zod Input Schemas ────────────────────────────────────────────────────────

export const CrawlRepoInputSchema = z.object({
  owner: z.string().min(1).describe('GitHub repository owner (user or org)'),
  repo: z.string().min(1).describe('GitHub repository name'),
  tier: z.enum(['1', '2', '3']).default('1').describe('Data tier: 1=default, 2=advanced, 3=security'),
  sections: z.array(z.string()).optional().describe(
    'Specific sections to include (e.g. ["metadata","tree","readme"]). If omitted, all sections for the tier are included.'
  ),
  exclude_sections: z.array(z.string()).optional().describe(
    'Sections to exclude from the tier'
  ),
  commit_limit: z.number().min(1).max(500).default(30).describe('Max commits to fetch'),
  contributor_limit: z.number().min(1).max(500).default(30).describe('Max contributors to fetch'),
});

export type CrawlRepoInput = z.infer<typeof CrawlRepoInputSchema>;

export const CrawlOrgInputSchema = z.object({
  org: z.string().min(1).describe('GitHub organization name'),
  tier: z.enum(['1', '2', '3']).default('1').describe('Data tier per repo'),
  min_stars: z.number().min(0).default(0).describe('Minimum stars filter'),
  language: z.string().optional().describe('Filter by primary language'),
  include_forks: z.boolean().default(false).describe('Include forked repos'),
  include_archived: z.boolean().default(false).describe('Include archived repos'),
  repo_limit: z.number().min(1).max(100).default(30).describe('Max repos to crawl'),
});

export type CrawlOrgInput = z.infer<typeof CrawlOrgInputSchema>;

export const RepoSummaryInputSchema = z.object({
  owner: z.string().min(1).describe('Repository owner'),
  repo: z.string().min(1).describe('Repository name'),
});

export type RepoSummaryInput = z.infer<typeof RepoSummaryInputSchema>;

export const CompareReposInputSchema = z.object({
  repos: z.array(z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
  })).min(2).max(5).describe('Repos to compare (2-5)'),
  aspects: z.array(z.enum([
    'metadata', 'languages', 'activity', 'community', 'size',
  ])).optional().describe('Comparison aspects (default: all)'),
});

export type CompareReposInput = z.infer<typeof CompareReposInputSchema>;

export const ExportDataInputSchema = z.object({
  data: z.any().describe('Previously crawled repo data (CrawlResult object)'),
  format: z.enum(['json', 'csv', 'markdown']).describe('Export format'),
  sections: z.array(z.string()).optional().describe('Sections to include in export'),
});

export type ExportDataInput = z.infer<typeof ExportDataInputSchema>;
