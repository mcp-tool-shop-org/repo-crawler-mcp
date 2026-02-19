import type {
  Tier1Data,
  Tier2Data,
  RepoMetadata,
  RateLimitInfo,
} from '../types.js';

export interface FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  commitLimit?: number;
  contributorLimit?: number;
}

export interface Tier2FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  issueLimit?: number;
  prLimit?: number;
  issueState?: 'open' | 'closed' | 'all';
}

export interface OrgListOptions {
  minStars?: number;
  language?: string;
  includeForks?: boolean;
  includeArchived?: boolean;
  limit?: number;
}

export interface PlatformAdapter {
  readonly platform: string;
  fetchTier1(owner: string, repo: string, options?: FetchOptions): Promise<Tier1Data>;
  fetchTier2(owner: string, repo: string, options?: Tier2FetchOptions): Promise<Tier2Data>;
  listOrgRepos(org: string, options?: OrgListOptions): Promise<RepoMetadata[]>;
  getRateLimit(): Promise<RateLimitInfo>;
}
