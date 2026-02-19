import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { successResponse, handleToolError, errorResponse } from '../utils/errors.js';
import { csvRow } from '../utils/csvEscape.js';
import { mdTableRow, mdTableSeparator } from '../utils/mdEscape.js';
import { ErrorCode } from '../types.js';

export function registerExportDataTool(server: McpServer): void {
  server.tool(
    'export_data',
    'Export previously crawled repository data as JSON, CSV, or Markdown. Pass the data object from a crawl_repo or crawl_org result.',
    {
      data: z.any().describe('Previously crawled repo data (CrawlResult or array of CrawlResults)'),
      format: z.enum(['json', 'csv', 'markdown']).describe('Export format'),
      sections: z.array(z.string()).optional().describe('Sections to include in export (default: all available)'),
    },
    async (args) => {
      try {
        if (!args.data) {
          return errorResponse(ErrorCode.INVALID_INPUT, 'No data provided to export');
        }

        switch (args.format) {
          case 'json':
            return successResponse(JSON.stringify(args.data, null, 2));

          case 'csv':
            return successResponse(exportCSV(args.data, args.sections));

          case 'markdown':
            return successResponse(exportMarkdown(args.data, args.sections));

          default:
            return errorResponse(ErrorCode.INVALID_INPUT, `Unknown format: ${args.format}`);
        }
      } catch (error) {
        return handleToolError(error);
      }
    },
  );
}

function exportCSV(data: Record<string, unknown>, sections?: string[]): string {
  const d = data.data as Record<string, unknown> | undefined ?? data;
  const parts: string[] = [];

  // Metadata
  if (shouldInclude('metadata', sections) && d.metadata) {
    const m = d.metadata as Record<string, unknown>;
    parts.push('# Metadata');
    parts.push(csvRow(['Field', 'Value']));
    for (const [k, v] of Object.entries(m)) {
      if (typeof v === 'object' && v !== null) continue;
      parts.push(csvRow([k, v]));
    }
    parts.push('');
  }

  // Files
  if (shouldInclude('tree', sections) && Array.isArray(d.tree) && d.tree.length > 0) {
    parts.push('# Files');
    parts.push(csvRow(['path', 'type', 'size', 'sha']));
    for (const f of d.tree as Array<Record<string, unknown>>) {
      parts.push(csvRow([f.path, f.type, f.size ?? '', f.sha]));
    }
    parts.push('');
  }

  // Commits
  if (shouldInclude('commits', sections) && Array.isArray(d.commits) && d.commits.length > 0) {
    parts.push('# Commits');
    parts.push(csvRow(['sha', 'author', 'date', 'message']));
    for (const c of d.commits as Array<Record<string, unknown>>) {
      const author = c.author as Record<string, unknown> | undefined;
      parts.push(csvRow([c.sha, author?.name ?? '', author?.date ?? '', c.message]));
    }
    parts.push('');
  }

  // Contributors
  if (shouldInclude('contributors', sections) && Array.isArray(d.contributors) && d.contributors.length > 0) {
    parts.push('# Contributors');
    parts.push(csvRow(['login', 'contributions', 'type']));
    for (const c of d.contributors as Array<Record<string, unknown>>) {
      parts.push(csvRow([c.login, c.contributions, c.type]));
    }
    parts.push('');
  }

  // Releases
  if (shouldInclude('releases', sections) && Array.isArray(d.releases) && d.releases.length > 0) {
    parts.push('# Releases');
    parts.push(csvRow(['tag', 'name', 'published_at', 'prerelease']));
    for (const r of d.releases as Array<Record<string, unknown>>) {
      parts.push(csvRow([r.tag_name, r.name, r.published_at, r.prerelease]));
    }
    parts.push('');
  }

  if (parts.length === 0) {
    return '# No data to export';
  }

  return parts.join('\n');
}

function exportMarkdown(data: Record<string, unknown>, sections?: string[]): string {
  const d = data.data as Record<string, unknown> | undefined ?? data;
  const lines: string[] = [];
  const owner = data.owner as string | undefined ?? '';
  const repo = data.repo as string | undefined ?? '';

  lines.push(`# ${owner}/${repo}`);
  lines.push('');

  // Metadata
  if (shouldInclude('metadata', sections) && d.metadata) {
    const m = d.metadata as Record<string, unknown>;
    lines.push('## Metadata');
    lines.push(mdTableRow(['Field', 'Value']));
    lines.push(mdTableSeparator(2));
    const fields = ['full_name', 'description', 'visibility', 'default_branch',
      'stargazers_count', 'forks_count', 'open_issues_count', 'created_at', 'pushed_at', 'html_url'];
    for (const f of fields) {
      if (m[f] !== undefined) {
        lines.push(mdTableRow([f, m[f]]));
      }
    }
    lines.push('');
  }

  // Languages
  if (shouldInclude('languages', sections) && d.languages) {
    const langs = d.languages as Record<string, number>;
    const total = Object.values(langs).reduce((a, b) => a + b, 0);
    if (total > 0) {
      lines.push('## Languages');
      lines.push(mdTableRow(['Language', 'Bytes', '%']));
      lines.push(mdTableSeparator(3));
      for (const [lang, bytes] of Object.entries(langs).sort(([, a], [, b]) => b - a)) {
        lines.push(mdTableRow([lang, bytes.toLocaleString(), `${Math.round(bytes / total * 100)}%`]));
      }
      lines.push('');
    }
  }

  // Commits
  if (shouldInclude('commits', sections) && Array.isArray(d.commits) && d.commits.length > 0) {
    lines.push('## Commits');
    lines.push(mdTableRow(['SHA', 'Author', 'Date', 'Message']));
    lines.push(mdTableSeparator(4));
    for (const c of d.commits as Array<Record<string, unknown>>) {
      const author = c.author as Record<string, unknown> | undefined;
      const sha = String(c.sha ?? '').slice(0, 7);
      const msg = String(c.message ?? '').split('\n')[0].slice(0, 80);
      lines.push(mdTableRow([sha, author?.name ?? '', String(author?.date ?? '').slice(0, 10), msg]));
    }
    lines.push('');
  }

  // Contributors
  if (shouldInclude('contributors', sections) && Array.isArray(d.contributors) && d.contributors.length > 0) {
    lines.push('## Contributors');
    lines.push(mdTableRow(['Login', 'Contributions', 'Type']));
    lines.push(mdTableSeparator(3));
    for (const c of d.contributors as Array<Record<string, unknown>>) {
      lines.push(mdTableRow([c.login, c.contributions, c.type]));
    }
    lines.push('');
  }

  // Releases
  if (shouldInclude('releases', sections) && Array.isArray(d.releases) && d.releases.length > 0) {
    lines.push('## Releases');
    lines.push(mdTableRow(['Tag', 'Name', 'Published', 'Prerelease']));
    lines.push(mdTableSeparator(4));
    for (const r of d.releases as Array<Record<string, unknown>>) {
      lines.push(mdTableRow([r.tag_name, r.name ?? '-', r.published_at ?? '-', r.prerelease ? 'Yes' : 'No']));
    }
    lines.push('');
  }

  if (lines.length <= 2) {
    lines.push('_No data to export_');
  }

  return lines.join('\n');
}

function shouldInclude(section: string, sections?: string[]): boolean {
  if (!sections || sections.length === 0) return true;
  return sections.includes(section);
}
