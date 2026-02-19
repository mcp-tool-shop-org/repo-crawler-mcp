import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';
import type { CrawlResult } from '../types.js';

export function registerCrawlRepoTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'crawl_repo',
    'Crawl a GitHub repository and return structured data. Tier 1 includes metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community profile, and workflows.',
    {
      owner: z.string().min(1).describe('GitHub repository owner (user or org)'),
      repo: z.string().min(1).describe('GitHub repository name'),
      tier: z.enum(['1', '2', '3']).default('1').describe('Data tier: 1=default, 2=advanced (future), 3=security (future)'),
      sections: z.array(z.string()).optional().describe(
        'Specific sections to include (e.g. ["metadata","tree","readme"]). Omit for all sections in the tier.'
      ),
      exclude_sections: z.array(z.string()).optional().describe('Sections to exclude from the tier'),
      commit_limit: z.number().min(1).max(500).default(30).describe('Max commits to fetch'),
      contributor_limit: z.number().min(1).max(500).default(30).describe('Max contributors to fetch'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

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

        return successResponse(result);
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
