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

  // Tier 2: Issues
  const t2 = data.tier2Data as Record<string, unknown> | undefined;
  if (t2) {
    if (shouldInclude('issues', sections) && Array.isArray(t2.issues) && t2.issues.length > 0) {
      parts.push('# Issues');
      parts.push(csvRow(['number', 'title', 'state', 'author', 'labels', 'created_at', 'comments', 'reactions']));
      for (const i of t2.issues as Array<Record<string, unknown>>) {
        const labels = Array.isArray(i.labels) ? (i.labels as string[]).join(';') : '';
        parts.push(csvRow([i.number, i.title, i.state, i.author, labels, i.created_at, i.comments, i.reactions_total]));
      }
      parts.push('');
    }

    // Tier 2: Pull Requests
    if (shouldInclude('pullRequests', sections) && Array.isArray(t2.pullRequests) && t2.pullRequests.length > 0) {
      parts.push('# Pull Requests');
      parts.push(csvRow(['number', 'title', 'state', 'author', 'draft', 'created_at', 'merged_at', 'additions', 'deletions']));
      for (const pr of t2.pullRequests as Array<Record<string, unknown>>) {
        parts.push(csvRow([pr.number, pr.title, pr.state, pr.author, pr.draft, pr.created_at, pr.merged_at ?? '', pr.additions ?? '', pr.deletions ?? '']));
      }
      parts.push('');
    }

    // Tier 2: Milestones
    if (shouldInclude('milestones', sections) && Array.isArray(t2.milestones) && t2.milestones.length > 0) {
      parts.push('# Milestones');
      parts.push(csvRow(['number', 'title', 'state', 'open_issues', 'closed_issues', 'due_on']));
      for (const m of t2.milestones as Array<Record<string, unknown>>) {
        parts.push(csvRow([m.number, m.title, m.state, m.open_issues, m.closed_issues, m.due_on ?? '']));
      }
      parts.push('');
    }
  }

  // Tier 3: Security
  const t3 = data.tier3Data as Record<string, unknown> | undefined;
  if (t3) {
    if (shouldInclude('dependabotAlerts', sections) && Array.isArray(t3.dependabotAlerts) && t3.dependabotAlerts.length > 0) {
      parts.push('# Dependabot Alerts');
      parts.push(csvRow(['number', 'state', 'severity', 'package', 'ecosystem', 'summary', 'patched_version', 'cve_id']));
      for (const a of t3.dependabotAlerts as Array<Record<string, unknown>>) {
        parts.push(csvRow([a.number, a.state, a.severity, a.package_name, a.package_ecosystem, a.summary, a.patched_version ?? '', a.cve_id ?? '']));
      }
      parts.push('');
    }

    if (shouldInclude('securityAdvisories', sections) && Array.isArray(t3.securityAdvisories) && t3.securityAdvisories.length > 0) {
      parts.push('# Security Advisories');
      parts.push(csvRow(['ghsa_id', 'cve_id', 'severity', 'state', 'summary', 'published_at']));
      for (const a of t3.securityAdvisories as Array<Record<string, unknown>>) {
        parts.push(csvRow([a.ghsa_id, a.cve_id ?? '', a.severity, a.state, a.summary, a.published_at ?? '']));
      }
      parts.push('');
    }

    if (shouldInclude('codeScanningAlerts', sections) && Array.isArray(t3.codeScanningAlerts) && t3.codeScanningAlerts.length > 0) {
      parts.push('# Code Scanning Alerts');
      parts.push(csvRow(['number', 'state', 'severity', 'rule_id', 'tool', 'description']));
      for (const a of t3.codeScanningAlerts as Array<Record<string, unknown>>) {
        parts.push(csvRow([a.number, a.state, a.severity, a.rule_id, a.tool_name, a.description]));
      }
      parts.push('');
    }

    if (shouldInclude('secretScanningAlerts', sections) && Array.isArray(t3.secretScanningAlerts) && t3.secretScanningAlerts.length > 0) {
      parts.push('# Secret Scanning Alerts');
      parts.push(csvRow(['number', 'state', 'secret_type', 'display_name', 'resolution', 'created_at']));
      for (const a of t3.secretScanningAlerts as Array<Record<string, unknown>>) {
        parts.push(csvRow([a.number, a.state, a.secret_type, a.secret_type_display_name, a.resolution ?? '', a.created_at]));
      }
      parts.push('');
    }
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

  // Tier 2: Issues
  const t2md = data.tier2Data as Record<string, unknown> | undefined;
  if (t2md) {
    if (shouldInclude('issues', sections) && Array.isArray(t2md.issues) && t2md.issues.length > 0) {
      lines.push('## Issues');
      lines.push(mdTableRow(['#', 'Title', 'State', 'Author', 'Labels', 'Comments', 'Reactions']));
      lines.push(mdTableSeparator(7));
      for (const i of t2md.issues as Array<Record<string, unknown>>) {
        const labels = Array.isArray(i.labels) ? (i.labels as string[]).join(', ') : '';
        lines.push(mdTableRow([i.number, String(i.title ?? '').slice(0, 60), i.state, i.author, labels, i.comments, i.reactions_total]));
      }
      lines.push('');
    }

    // Tier 2: Pull Requests
    if (shouldInclude('pullRequests', sections) && Array.isArray(t2md.pullRequests) && t2md.pullRequests.length > 0) {
      lines.push('## Pull Requests');
      lines.push(mdTableRow(['#', 'Title', 'State', 'Author', 'Draft', 'Merged', '+/-']));
      lines.push(mdTableSeparator(7));
      for (const pr of t2md.pullRequests as Array<Record<string, unknown>>) {
        const merged = pr.merged_at ? String(pr.merged_at).slice(0, 10) : '-';
        const diff = (pr.additions != null && pr.deletions != null) ? `+${pr.additions}/-${pr.deletions}` : '-';
        lines.push(mdTableRow([pr.number, String(pr.title ?? '').slice(0, 60), pr.state, pr.author, pr.draft ? 'Yes' : 'No', merged, diff]));
      }
      lines.push('');
    }

    // Tier 2: Milestones
    if (shouldInclude('milestones', sections) && Array.isArray(t2md.milestones) && t2md.milestones.length > 0) {
      lines.push('## Milestones');
      lines.push(mdTableRow(['#', 'Title', 'State', 'Open', 'Closed', 'Due']));
      lines.push(mdTableSeparator(6));
      for (const m of t2md.milestones as Array<Record<string, unknown>>) {
        lines.push(mdTableRow([m.number, m.title, m.state, m.open_issues, m.closed_issues, m.due_on ?? '-']));
      }
      lines.push('');
    }
  }

  // Tier 3: Security
  const t3md = data.tier3Data as Record<string, unknown> | undefined;
  if (t3md) {
    if (shouldInclude('dependabotAlerts', sections) && Array.isArray(t3md.dependabotAlerts) && t3md.dependabotAlerts.length > 0) {
      lines.push('## Dependabot Alerts');
      lines.push(mdTableRow(['#', 'Severity', 'Package', 'Ecosystem', 'Summary', 'Patched']));
      lines.push(mdTableSeparator(6));
      for (const a of t3md.dependabotAlerts as Array<Record<string, unknown>>) {
        lines.push(mdTableRow([a.number, a.severity, a.package_name, a.package_ecosystem, String(a.summary ?? '').slice(0, 60), a.patched_version ?? '-']));
      }
      lines.push('');
    }

    if (shouldInclude('securityAdvisories', sections) && Array.isArray(t3md.securityAdvisories) && t3md.securityAdvisories.length > 0) {
      lines.push('## Security Advisories');
      lines.push(mdTableRow(['GHSA', 'CVE', 'Severity', 'State', 'Summary']));
      lines.push(mdTableSeparator(5));
      for (const a of t3md.securityAdvisories as Array<Record<string, unknown>>) {
        lines.push(mdTableRow([a.ghsa_id, a.cve_id ?? '-', a.severity, a.state, String(a.summary ?? '').slice(0, 60)]));
      }
      lines.push('');
    }

    if (shouldInclude('codeScanningAlerts', sections) && Array.isArray(t3md.codeScanningAlerts) && t3md.codeScanningAlerts.length > 0) {
      lines.push('## Code Scanning Alerts');
      lines.push(mdTableRow(['#', 'Severity', 'Rule', 'Tool', 'Description']));
      lines.push(mdTableSeparator(5));
      for (const a of t3md.codeScanningAlerts as Array<Record<string, unknown>>) {
        lines.push(mdTableRow([a.number, a.severity, a.rule_id, a.tool_name, String(a.description ?? '').slice(0, 60)]));
      }
      lines.push('');
    }

    if (shouldInclude('secretScanningAlerts', sections) && Array.isArray(t3md.secretScanningAlerts) && t3md.secretScanningAlerts.length > 0) {
      lines.push('## Secret Scanning Alerts');
      lines.push(mdTableRow(['#', 'State', 'Type', 'Resolution', 'Created']));
      lines.push(mdTableSeparator(5));
      for (const a of t3md.secretScanningAlerts as Array<Record<string, unknown>>) {
        lines.push(mdTableRow([a.number, a.state, a.secret_type_display_name, a.resolution ?? '-', String(a.created_at ?? '').slice(0, 10)]));
      }
      lines.push('');
    }

    // Permission summary
    const perms = t3md.permissions as Record<string, string> | undefined;
    if (perms && Object.keys(perms).length > 0) {
      lines.push('## Security Permissions');
      lines.push(mdTableRow(['Section', 'Status']));
      lines.push(mdTableSeparator(2));
      for (const [section, status] of Object.entries(perms)) {
        lines.push(mdTableRow([section, status]));
      }
      lines.push('');
    }
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
