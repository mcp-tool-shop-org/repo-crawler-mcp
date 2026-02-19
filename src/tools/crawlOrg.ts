import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOrg } from '../utils/validation.js';
import { successResponse, handleToolError, errorResponse } from '../utils/errors.js';
import { ErrorCode } from '../types.js';
import type { CrawlResult } from '../types.js';
import { log } from '../utils/logger.js';

export function registerCrawlOrgTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'crawl_org',
    'Crawl all repositories in a GitHub organization. Lists repos with filters, then crawls each at the specified tier. Returns an array of crawl results.',
    {
      org: z.string().min(1).describe('GitHub organization name'),
      tier: z.enum(['1', '2', '3']).default('1').describe('Data tier per repo'),
      min_stars: z.number().min(0).default(0).describe('Minimum stars filter'),
      language: z.string().optional().describe('Filter by primary language'),
      include_forks: z.boolean().default(false).describe('Include forked repos'),
      include_archived: z.boolean().default(false).describe('Include archived repos'),
      repo_limit: z.number().min(1).max(100).default(30).describe('Max repos to crawl'),
      commit_limit: z.number().min(1).max(100).default(10).describe('Max commits per repo'),
      contributor_limit: z.number().min(1).max(100).default(10).describe('Max contributors per repo'),
    },
    async (args) => {
      try {
        validateOrg(args.org);

        const repos = await adapter.listOrgRepos(args.org, {
          minStars: args.min_stars,
          language: args.language,
          includeForks: args.include_forks,
          includeArchived: args.include_archived,
          limit: args.repo_limit,
        });

        if (repos.length === 0) {
          return errorResponse(ErrorCode.ORG_NOT_FOUND, `No repos found for org "${args.org}" with the given filters`);
        }

        log.info(`Crawling ${repos.length} repos in ${args.org}...`);

        const results: CrawlResult[] = [];
        for (const repo of repos) {
          try {
            const data = await adapter.fetchTier1(args.org, repo.name, {
              commitLimit: args.commit_limit,
              contributorLimit: args.contributor_limit,
            });

            results.push({
              owner: args.org,
              repo: repo.name,
              crawledAt: new Date().toISOString(),
              tier: args.tier,
              sections: ['all'],
              data,
            });

            log.info(`  Crawled ${repo.name} (${results.length}/${repos.length})`);
          } catch (error) {
            log.warn(`  Failed to crawl ${repo.name}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }

        return successResponse({
          org: args.org,
          totalReposFound: repos.length,
          totalCrawled: results.length,
          results,
        });
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
