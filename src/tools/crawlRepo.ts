import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';
import type { CrawlResult } from '../types.js';

export function registerCrawlRepoTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'crawl_repo',
    'Crawl a GitHub repository and return structured data. Tier 1: metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community, workflows. Tier 2: adds issues, PRs, traffic, milestones, discussions.',
    {
      owner: z.string().min(1).describe('GitHub repository owner (user or org)'),
      repo: z.string().min(1).describe('GitHub repository name'),
      tier: z.enum(['1', '2', '3']).default('1').describe('Data tier: 1=default, 2=advanced (issues/PRs/traffic), 3=security (future)'),
      sections: z.array(z.string()).optional().describe(
        'Specific sections to include (e.g. ["metadata","tree","issues","pullRequests"]). Omit for all sections in the tier.'
      ),
      exclude_sections: z.array(z.string()).optional().describe('Sections to exclude from the tier'),
      commit_limit: z.number().min(1).max(500).default(30).describe('Max commits to fetch'),
      contributor_limit: z.number().min(1).max(500).default(30).describe('Max contributors to fetch'),
      issue_limit: z.number().min(1).max(1000).default(100).describe('Max issues to fetch (Tier 2)'),
      pr_limit: z.number().min(1).max(1000).default(100).describe('Max pull requests to fetch (Tier 2)'),
      issue_state: z.enum(['open', 'closed', 'all']).default('all').describe('Issue/PR state filter (Tier 2)'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

        // Always fetch Tier 1
        const data = await adapter.fetchTier1(args.owner, args.repo, {
          sections: args.sections,
          excludeSections: args.exclude_sections,
          commitLimit: args.commit_limit,
          contributorLimit: args.contributor_limit,
        });

        const result: CrawlResult = {
          owner: args.owner,
          repo: args.repo,
          crawledAt: new Date().toISOString(),
          tier: args.tier,
          sections: args.sections ?? ['all'],
          data,
        };

        // Tier 2+: fetch advanced data
        if (args.tier === '2' || args.tier === '3') {
          result.tier2Data = await adapter.fetchTier2(args.owner, args.repo, {
            sections: args.sections,
            excludeSections: args.exclude_sections,
            issueLimit: args.issue_limit,
            prLimit: args.pr_limit,
            issueState: args.issue_state,
          });
        }

        return successResponse(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
