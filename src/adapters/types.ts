import type {
  Tier1Data,
  RepoMetadata,
  RateLimitInfo,
} from '../types.js';

export interface FetchOptions {
  sections?: string[];
  excludeSections?: string[];
  commitLimit?: number;
  contributorLimit?: number;
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
  listOrgRepos(org: string, options?: OrgListOptions): Promise<RepoMetadata[]>;
  getRateLimit(): Promise<RateLimitInfo>;
}
