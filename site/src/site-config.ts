import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: 'Repo Crawler MCP',
  description: 'MCP server that crawls GitHub repos and extracts structured data for AI agents',
  logoBadge: 'RC',
  brandName: 'repo-crawler-mcp',
  repoUrl: 'https://github.com/mcp-tool-shop-org/repo-crawler-mcp',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/repo-crawler-mcp',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'MCP Server',
    headline: 'Repo Crawler',
    headlineAccent: 'for AI agents.',
    description: 'Turn any GitHub repo into structured intelligence. Metadata, issues, security alerts, SBOMs — all through one tool call.',
    primaryCta: { href: '#quick-start', label: 'Get started' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Quick scan', code: 'get_repo_summary({ owner: "facebook", repo: "react" })' },
      { label: 'Deep crawl', code: 'crawl_repo({ owner: "myorg", repo: "api", tier: "3" })' },
      { label: 'Compare', code: 'compare_repos({ repos: [{ owner: "vitejs", repo: "vite" }, ...] })' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything an AI agent needs to understand a repository.',
      features: [
        { title: '5 MCP Tools', desc: 'Crawl repos, crawl orgs, summarize, compare, and export — each purpose-built for a different workflow.' },
        { title: '3-Tier Data Model', desc: 'Start light with metadata, go deeper with issues and PRs, or get the full security picture with Dependabot, SBOM, and secret scanning.' },
        { title: 'Section-Selective', desc: 'Only calls the APIs you ask for. Request specific sections to save quota and shrink response size.' },
        { title: 'Graceful Degradation', desc: 'A 403 on Dependabot won\'t kill the crawl. Each section fetches independently with permission tracking.' },
        { title: 'Rate-Limit Safe', desc: 'Built-in Octokit throttling with automatic retry on 429s. No more blowing through your API quota.' },
        { title: 'Safe Exports', desc: 'CSV with formula injection prevention, Markdown with pipe escaping. Export crawl data without security risks.' },
      ],
    },
    {
      kind: 'code-cards',
      id: 'quick-start',
      title: 'Quick Start',
      subtitle: 'Add to your MCP client config and start crawling.',
      cards: [
        {
          title: 'Claude Code / Claude Desktop',
          code: `{
  "mcpServers": {
    "repo-crawler": {
      "command": "npx",
      "args": ["-y", "@mcptoolshop/repo-crawler-mcp"],
      "env": {
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}`,
        },
        {
          title: 'Try it',
          code: `// Quick repo triage (4 API calls)
get_repo_summary({ owner: "expressjs", repo: "express" })

// Full security audit
crawl_repo({ owner: "myorg", repo: "api", tier: "3" })

// Compare frameworks side-by-side
compare_repos({ repos: [
  { owner: "sveltejs", repo: "svelte" },
  { owner: "vuejs", repo: "core" },
  { owner: "facebook", repo: "react" }
]})`,
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'tiers',
      title: 'Data Tiers',
      subtitle: 'Choose the depth of data you need. Each tier includes everything below it.',
      columns: ['Tier', 'What you get', 'API calls'],
      rows: [
        ['Tier 1 — Fundamentals', 'Metadata, file tree, languages, README, commits, contributors, branches, tags, releases, community, workflows', '~11'],
        ['Tier 2 — Activity', 'Tier 1 + issues, PRs, traffic, milestones', '~15+'],
        ['Tier 3 — Security', 'Tier 2 + Dependabot alerts, security advisories, SBOM, code scanning, secret scanning', '~20+'],
      ],
    },
    {
      kind: 'api',
      id: 'tools',
      title: 'Tools',
      subtitle: 'Five MCP tools covering the full GitHub data surface.',
      apis: [
        { signature: 'crawl_repo({ owner, repo, tier, sections? })', description: 'Crawl a single repository at any data tier. Supports section-selective fetching and configurable limits for commits, issues, PRs, and alerts.' },
        { signature: 'crawl_org({ org, tier, min_stars?, language? })', description: 'Crawl every repo in an organization with filters for stars, language, forks, and archived status.' },
        { signature: 'get_repo_summary({ owner, repo })', description: 'Quick human-readable summary using only 4 API calls. Ideal for triage and initial assessment.' },
        { signature: 'compare_repos({ repos, aspects? })', description: 'Side-by-side comparison of 2–5 repos. Stars, languages, activity, community health, and size.' },
        { signature: 'export_data({ data, format, sections? })', description: 'Export crawl results as JSON, CSV, or Markdown. CSV includes formula injection prevention.' },
      ],
    },
  ],
};
