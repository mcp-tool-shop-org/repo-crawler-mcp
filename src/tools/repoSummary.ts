import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { PlatformAdapter } from '../adapters/types.js';
import { validateOwnerRepo } from '../utils/validation.js';
import { successResponse, handleToolError } from '../utils/errors.js';

export function registerRepoSummaryTool(server: McpServer, adapter: PlatformAdapter): void {
  server.tool(
    'get_repo_summary',
    'Get a quick, human-readable summary of a GitHub repository. Fetches only essential metadata — fast and cheap on API quota.',
    {
      owner: z.string().min(1).describe('Repository owner'),
      repo: z.string().min(1).describe('Repository name'),
    },
    async (args) => {
      try {
        validateOwnerRepo(args.owner, args.repo);

        const data = await adapter.fetchTier1(args.owner, args.repo, {
          sections: ['metadata', 'languages', 'readme', 'community'],
        });

        const m = data.metadata;
        if (!m) {
          return successResponse(`Could not fetch metadata for ${args.owner}/${args.repo}`);
        }

        // Build language breakdown string
        const totalBytes = Object.values(data.languages).reduce((a, b) => a + b, 0);
        const langStr = totalBytes > 0
          ? Object.entries(data.languages)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([lang, bytes]) => `${lang} (${Math.round(bytes / totalBytes * 100)}%)`)
              .join(', ')
          : 'None detected';

        // Community health
        const c = data.community;
        const communityParts: string[] = [];
        if (c) {
          if (c.files.contributing) communityParts.push('Contributing guide');
          if (c.files.code_of_conduct) communityParts.push('Code of conduct');
          if (c.files.issue_template) communityParts.push('Issue templates');
          if (c.files.pull_request_template) communityParts.push('PR template');
        }

        const lines = [
          `## ${m.full_name}`,
          m.description || '_No description_',
          '',
          `Stars: ${m.stargazers_count.toLocaleString()} | Forks: ${m.forks_count.toLocaleString()} | Open Issues: ${m.open_issues_count.toLocaleString()}`,
          `License: ${m.license?.spdx_id ?? 'None'} | Visibility: ${m.visibility}`,
          `Languages: ${langStr}`,
          `Default branch: ${m.default_branch}`,
          `Created: ${m.created_at.slice(0, 10)} | Last push: ${m.pushed_at.slice(0, 10)}`,
          m.homepage ? `Homepage: ${m.homepage}` : '',
          m.archived ? '**ARCHIVED**' : '',
          m.fork && m.parent ? `Fork of: ${m.parent.full_name}` : '',
          '',
          c ? `Community health: ${c.health_percentage}%` : '',
          communityParts.length > 0 ? `Community files: ${communityParts.join(', ')}` : '',
          '',
          `Features: ${[m.has_issues && 'Issues', m.has_wiki && 'Wiki', m.has_discussions && 'Discussions'].filter(Boolean).join(', ') || 'None'}`,
          '',
          `URL: ${m.html_url}`,
        ];

        return successResponse(lines.filter(l => l !== '').join('\n'));
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}
