import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';
import { mdTableRow, mdTableSeparator } from '../utils/mdEscape.js';

export function registerCompareReposTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'compare_repos',
    'Compare 2-5 GitHub repositories side by side. Returns a formatted comparison table covering stars, forks, languages, activity, community health, and more.',
    {
      repos: z.array(z.object({
        owner: z.string().min(1),
        repo: z.string().min(1),
      })).min(2).max(5).describe('Repos to compare (2-5)'),
      aspects: z.array(z.enum([
        'metadata', 'languages', 'activity', 'community', 'size',
      ])).optional().describe('Comparison aspects (default: all)'),
    },
    async (args) => {
      try {
        for (const r of args.repos) {
          validateOwnerRepo(r.owner, r.repo);
        }

        const aspects = args.aspects ?? ['metadata', 'languages', 'activity', 'community', 'size'];

        // Fetch all repos in parallel
        const results = await Promise.allSettled(
          args.repos.map(r =>
            adapter.fetchTier1(r.owner, r.repo, {
              sections: ['metadata', 'languages', 'community', 'commits'],
              commitLimit: 10,
            }),
          ),
        );

        const names = args.repos.map(r => `${r.owner}/${r.repo}`);
        const lines: string[] = ['# Repository Comparison', ''];

        // Header
        lines.push(mdTableRow(['Metric', ...names]));
        lines.push(mdTableSeparator(names.length + 1));

        for (const aspect of aspects) {
          switch (aspect) {
            case 'metadata': {
              const stars = results.map(r =>
                r.status === 'fulfilled' ? (r.value.metadata?.stargazers_count ?? '-').toLocaleString() : 'Error',
              );
              const forks = results.map(r =>
                r.status === 'fulfilled' ? (r.value.metadata?.forks_count ?? '-').toLocaleString() : 'Error',
              );
              const issues = results.map(r =>
                r.status === 'fulfilled' ? (r.value.metadata?.open_issues_count ?? '-').toLocaleString() : 'Error',
              );
              const license = results.map(r =>
                r.status === 'fulfilled' ? (r.value.metadata?.license?.spdx_id ?? 'None') : 'Error',
              );
              lines.push(mdTableRow(['Stars', ...stars]));
              lines.push(mdTableRow(['Forks', ...forks]));
              lines.push(mdTableRow(['Open Issues', ...issues]));
              lines.push(mdTableRow(['License', ...license]));
              break;
            }
            case 'languages': {
              const langs = results.map(r => {
                if (r.status !== 'fulfilled') return 'Error';
                const total = Object.values(r.value.languages).reduce((a, b) => a + b, 0);
                if (total === 0) return 'None';
                return Object.entries(r.value.languages)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 3)
                  .map(([l, b]) => `${l} ${Math.round(b / total * 100)}%`)
                  .join(', ');
              });
              lines.push(mdTableRow(['Languages', ...langs]));
              break;
            }
            case 'activity': {
              const lastPush = results.map(r =>
                r.status === 'fulfilled' ? (r.value.metadata?.pushed_at?.slice(0, 10) ?? '-') : 'Error',
              );
              const recentCommits = results.map(r =>
                r.status === 'fulfilled' ? String(r.value.commits.length) : 'Error',
              );
              lines.push(mdTableRow(['Last Push', ...lastPush]));
              lines.push(mdTableRow(['Recent Commits', ...recentCommits]));
              break;
            }
            case 'community': {
              const health = results.map(r =>
                r.status === 'fulfilled' ? `${r.value.community?.health_percentage ?? '-'}%` : 'Error',
              );
              lines.push(mdTableRow(['Community Health', ...health]));
              break;
            }
            case 'size': {
              const size = results.map(r =>
                r.status === 'fulfilled' ? `${((r.value.metadata?.size ?? 0) / 1024).toFixed(1)} MB` : 'Error',
              );
              const files = results.map(r =>
                r.status === 'fulfilled' ? String(r.value.tree.filter(e => e.type === 'blob').length) : 'Error',
              );
              lines.push(mdTableRow(['Repo Size', ...size]));
              lines.push(mdTableRow(['File Count', ...files]));
              break;
            }
          }
        }

        return successResponse(lines.join('\n'));
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
